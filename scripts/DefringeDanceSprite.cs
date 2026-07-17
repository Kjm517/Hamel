// Two-phase cleanup: (1) flood outer dark bg (2) melt cream fringe into loader blue
// Dark penguin body stays because cream ring separates it from outer bg.
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

class Program {
  const int BgR = 0xE0, BgG = 0xF2, BgB = 0xFE;

  static double Lum(int r, int g, int b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  static bool IsOrange(int r, int g, int b) {
    return r > 145 && (r - b) > 45 && b < 120;
  }
  static bool IsBlueHat(int r, int g, int b) {
    return b > 105 && b > r + 10 && b >= g;
  }
  static bool IsOuterDark(int r, int g, int b) {
    if (IsOrange(r, g, b) || IsBlueHat(r, g, b)) return false;
    double lum = Lum(r, g, b);
    int chroma = Math.Max(r, Math.Max(g, b)) - Math.Min(r, Math.Min(g, b));
    return lum <= 58 && chroma <= 45;
  }
  static bool IsCreamFringe(int r, int g, int b) {
    if (IsOrange(r, g, b) || IsBlueHat(r, g, b) || IsOuterDark(r, g, b)) return false;
    int min = Math.Min(r, Math.Min(g, b));
    int max = Math.Max(r, Math.Max(g, b));
    int chroma = max - min;
    double lum = Lum(r, g, b);
    // Never touch near-neutral bright white (belly / face / H)
    if (min >= 200 && chroma <= 35) return false;
    if (lum >= 210 && chroma <= 40) return false;
    // Warm cream / beige cutout fringe only
    if (lum >= 145 && lum <= 245 && chroma >= 10 && chroma <= 80 && r >= g - 5 && r > b + 6)
      return true;
    if (lum >= 160 && r > 180 && g > 155 && b > 120 && b < 215 && (r - b) >= 8)
      return true;
    return false;
  }

  static void SetBg(byte[] px, int i) {
    px[i] = (byte)BgB; px[i + 1] = (byte)BgG; px[i + 2] = (byte)BgR; px[i + 3] = 255;
  }

  static void Main() {
    string srcPath = @"d:\code-project\Project Hamel\Main\public\hamel\mascot\Hamel-dance-sheet.png";
    string dstPath = @"d:\code-project\Project Hamel\Main\public\hamel\mascot\Hamel-dance-sheet-transparent.png";

    Bitmap src = new Bitmap(srcPath);
    int w = src.Width, h = src.Height;
    Console.WriteLine(string.Format("source {0}x{1}", w, h));

    Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    Rectangle rect = new Rectangle(0, 0, w, h);
    BitmapData sbd = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    BitmapData dbd = bmp.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
    byte[] px = new byte[sbd.Stride * h];
    Marshal.Copy(sbd.Scan0, px, 0, px.Length);
    for (int i = 3; i < px.Length; i += 4) px[i] = 255;
    Marshal.Copy(px, 0, dbd.Scan0, px.Length);
    src.UnlockBits(sbd);
    bmp.UnlockBits(dbd);
    src.Dispose();

    dbd = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int stride = dbd.Stride;
    px = new byte[stride * h];
    Marshal.Copy(dbd.Scan0, px, 0, px.Length);

    bool[] isBg = new bool[w * h];
    Queue<int> q = new Queue<int>();
    int[] dx = new int[] { -1, 1, 0, 0 };
    int[] dy = new int[] { 0, 0, -1, 1 };

    // Phase 1: flood outer dark from borders only
    for (int x = 0; x < w; x++) {
      TrySeedDark(px, stride, w, h, x, 0, isBg, q);
      TrySeedDark(px, stride, w, h, x, h - 1, isBg, q);
    }
    for (int y = 0; y < h; y++) {
      TrySeedDark(px, stride, w, h, 0, y, isBg, q);
      TrySeedDark(px, stride, w, h, w - 1, y, isBg, q);
    }
    int darkFilled = 0;
    while (q.Count > 0) {
      int idx = q.Dequeue();
      int x = idx % w, y = idx / w;
      SetBg(px, y * stride + x * 4);
      darkFilled++;
      for (int k = 0; k < 4; k++) {
        int nx = x + dx[k], ny = y + dy[k];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        TrySeedDark(px, stride, w, h, nx, ny, isBg, q);
      }
    }
    Console.WriteLine(string.Format("phase1 outer dark: {0}", darkFilled));

    // Phase 2: melt cream fringe adjacent to bg (do not enter dark body)
    int cream = 0;
    for (int iter = 0; iter < 4; iter++) {
      int hit = 0;
      for (int y = 1; y < h - 1; y++) {
        for (int x = 1; x < w - 1; x++) {
          int idx = y * w + x;
          if (isBg[idx]) continue;
          int i = y * stride + x * 4;
          int b = px[i], g = px[i + 1], r = px[i + 2];

          bool nearBg = false, nearDark = false;
          for (int k = 0; k < 4; k++) {
            int nx = x + dx[k], ny = y + dy[k];
            int nidx = ny * w + nx;
            if (isBg[nidx]) nearBg = true;
            else {
              int j = ny * stride + nx * 4;
              if (IsOuterDark(px[j + 2], px[j + 1], px[j])) nearDark = true;
            }
          }
          if (!nearBg) continue;

          bool melt = IsCreamFringe(r, g, b);
          // Pure white fringe sandwiched between bg and dark body
          int min = Math.Min(r, Math.Min(g, b));
          int max = Math.Max(r, Math.Max(g, b));
          if (!melt && nearDark && min >= 200 && (max - min) <= 40) melt = true;

          if (!melt) continue;
          SetBg(px, i);
          isBg[idx] = true;
          hit++;
        }
      }
      cream += hit;
      Console.WriteLine(string.Format("phase2 cream iter {0}: {1}", iter, hit));
      if (hit == 0) break;
    }
    Console.WriteLine(string.Format("cream melted total: {0}", cream));

    // Phase 3: distance-limited cleanup of leftover bright edge junk (not interior white)
    int[] dist = new int[w * h];
    for (int i = 0; i < dist.Length; i++) dist[i] = 9999;
    Queue<int> dq = new Queue<int>();
    for (int i = 0; i < isBg.Length; i++) {
      if (!isBg[i]) continue;
      dist[i] = 0;
      dq.Enqueue(i);
    }
    while (dq.Count > 0) {
      int idx = dq.Dequeue();
      int x = idx % w, y = idx / w;
      int d = dist[idx];
      if (d >= 2) continue;
      for (int k = 0; k < 4; k++) {
        int nx = x + dx[k], ny = y + dy[k];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        int nidx = ny * w + nx;
        if (dist[nidx] <= d + 1) continue;
        dist[nidx] = d + 1;
        dq.Enqueue(nidx);
      }
    }
    int phase3 = 0;
    for (int y = 0; y < h; y++) {
      for (int x = 0; x < w; x++) {
        int idx = y * w + x;
        if (isBg[idx] || dist[idx] > 2) continue;
        int i = y * stride + x * 4;
        int b = px[i], g = px[i + 1], r = px[i + 2];
        if (IsOrange(r, g, b) || IsBlueHat(r, g, b) || IsOuterDark(r, g, b)) continue;
        double lum = Lum(r, g, b);
        int min = Math.Min(r, Math.Min(g, b));
        int max = Math.Max(r, Math.Max(g, b));
        int chroma = max - min;
        // count white-ish neighbors — interior belly has many
        int whiteN = 0;
        for (int k = 0; k < 4; k++) {
          int nx = x + dx[k], ny = y + dy[k];
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          int j = ny * stride + nx * 4;
          int nr = px[j + 2], ng = px[j + 1], nb = px[j];
          if (Math.Min(nr, Math.Min(ng, nb)) >= 190) whiteN++;
        }
        bool edgeJunk = lum >= 155 && whiteN <= 2;
        bool warmFringe = lum >= 145 && chroma >= 8 && r > b + 5 && whiteN <= 3;
        if (!edgeJunk && !warmFringe) continue;
        SetBg(px, i);
        isBg[idx] = true;
        phase3++;
      }
    }
    Console.WriteLine(string.Format("phase3 edge junk: {0}", phase3));

    Marshal.Copy(px, 0, dbd.Scan0, px.Length);
    bmp.UnlockBits(dbd);
    bmp.Save(dstPath, ImageFormat.Png);
    bmp.Dispose();
    Console.WriteLine("wrote " + dstPath);
  }

  static void TrySeedDark(byte[] px, int stride, int w, int h, int x, int y, bool[] isBg, Queue<int> q) {
    int idx = y * w + x;
    if (isBg[idx]) return;
    int i = y * stride + x * 4;
    if (!IsOuterDark(px[i + 2], px[i + 1], px[i])) return;
    isBg[idx] = true;
    q.Enqueue(idx);
  }
}
