// Key opaque white backdrop on penguin_dance_spritesheet.png → real transparency
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

class Program {
  static bool IsBackdropWhite(int r, int g, int b) {
    int min = Math.Min(r, Math.Min(g, b));
    int max = Math.Max(r, Math.Max(g, b));
    int chroma = max - min;
    // Sheet backdrop is near-pure white; belly is warmer / lower
    if (min >= 248 && chroma <= 12) return true;
    if (min >= 250) return true;
    if (min >= 245 && chroma <= 8) return true;
    return false;
  }

  static void Main() {
    string srcPath = @"d:\code-project\Project Hamel\Main\public\hamel\mascot\penguin_dance_spritesheet.png";
    string dstPath = @"d:\code-project\Project Hamel\Main\public\hamel\mascot\penguin_dance_spritesheet.png";

    Bitmap src = new Bitmap(srcPath);
    int w = src.Width, h = src.Height;
    Console.WriteLine(string.Format("source {0}x{1}", w, h));

    Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
    Rectangle rect = new Rectangle(0, 0, w, h);
    BitmapData sbd = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    BitmapData dbd = bmp.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
    byte[] px = new byte[sbd.Stride * h];
    Marshal.Copy(sbd.Scan0, px, 0, px.Length);
    Marshal.Copy(px, 0, dbd.Scan0, px.Length);
    src.UnlockBits(sbd);
    bmp.UnlockBits(dbd);
    src.Dispose();

    dbd = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    int stride = dbd.Stride;
    px = new byte[stride * h];
    Marshal.Copy(dbd.Scan0, px, 0, px.Length);

    bool[] visited = new bool[w * h];
    Queue<int> q = new Queue<int>();
    int[] dx = new int[] { -1, 1, 0, 0 };
    int[] dy = new int[] { 0, 0, -1, 1 };

    Action<int, int> trySeed = delegate(int x, int y) {
      int idx = y * w + x;
      if (visited[idx]) return;
      int i = y * stride + x * 4;
      if (!IsBackdropWhite(px[i + 2], px[i + 1], px[i])) return;
      visited[idx] = true;
      q.Enqueue(idx);
    };

    for (int x = 0; x < w; x++) { trySeed(x, 0); trySeed(x, h - 1); }
    for (int y = 0; y < h; y++) { trySeed(0, y); trySeed(w - 1, y); }

    // Also seed each frame's left/right edges (strip may have white between frames)
    int frameW = w / 6;
    for (int f = 0; f < 6; f++) {
      int left = f * frameW;
      int right = left + frameW - 1;
      for (int y = 0; y < h; y++) {
        trySeed(left, y);
        trySeed(right, y);
      }
    }

    Console.WriteLine(string.Format("seeds={0}", q.Count));
    int cleared = 0;
    while (q.Count > 0) {
      int idx = q.Dequeue();
      int x = idx % w, y = idx / w;
      int i = y * stride + x * 4;
      px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0;
      cleared++;
      for (int k = 0; k < 4; k++) {
        int nx = x + dx[k], ny = y + dy[k];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        int nidx = ny * w + nx;
        if (visited[nidx]) continue;
        int j = ny * stride + nx * 4;
        if (!IsBackdropWhite(px[j + 2], px[j + 1], px[j])) continue;
        visited[nidx] = true;
        q.Enqueue(nidx);
      }
    }

    // Soften near-white fringe still touching transparent (1px)
    for (int iter = 0; iter < 2; iter++) {
      int hit = 0;
      byte[] snap = (byte[])px.Clone();
      for (int y = 1; y < h - 1; y++) {
        for (int x = 1; x < w - 1; x++) {
          int i = y * stride + x * 4;
          if (snap[i + 3] == 0) continue;
          int r = snap[i + 2], g = snap[i + 1], b = snap[i];
          int min = Math.Min(r, Math.Min(g, b));
          int max = Math.Max(r, Math.Max(g, b));
          if (min < 230 || (max - min) > 30) continue;
          bool nearClear = false;
          for (int k = 0; k < 4; k++) {
            int j = (y + dy[k]) * stride + (x + dx[k]) * 4;
            if (snap[j + 3] == 0) { nearClear = true; break; }
          }
          if (!nearClear) continue;
          px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0;
          hit++;
        }
      }
      Console.WriteLine(string.Format("fringe pass {0}: {1}", iter, hit));
    }

    Marshal.Copy(px, 0, dbd.Scan0, px.Length);
    bmp.UnlockBits(dbd);
    bmp.Save(dstPath, ImageFormat.Png);
    bmp.Dispose();

    Bitmap check = new Bitmap(dstPath);
    Color c0 = check.GetPixel(0, 0);
    Color c1 = check.GetPixel(800, 800);
    Console.WriteLine(string.Format("cleared={0} cornerA={1} bellySampleA={2} RGB={3},{4},{5}",
      cleared, c0.A, c1.A, c1.R, c1.G, c1.B));
    check.Dispose();
    Console.WriteLine("wrote " + dstPath);
  }
}
