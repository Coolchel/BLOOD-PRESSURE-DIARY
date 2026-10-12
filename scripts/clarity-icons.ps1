Add-Type -AssemblyName System.Drawing
$taskRoot = Split-Path -Parent $PSScriptRoot
foreach ($taskKind in @('app', 'splash')) {
  $taskBitmap = [System.Drawing.Bitmap]::new(1024, 1024)
  $taskGraphics = [System.Drawing.Graphics]::FromImage($taskBitmap)
  $taskGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  if ($taskKind -eq 'app') { $taskGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#495B35')) }
  else { $taskGraphics.Clear([System.Drawing.Color]::Transparent) }
  $taskStroke = if ($taskKind -eq 'app') { '#FDFBF6' } else { '#495B35' }
  $taskPen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($taskStroke), 46)
  $taskPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $taskPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $taskPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  # Same pulse SVG path as the prototype, placed in Android's mask-safe centre.
  $taskPoints = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new(252,512), [System.Drawing.PointF]::new(382,512),
    [System.Drawing.PointF]::new(460,304), [System.Drawing.PointF]::new(564,720),
    [System.Drawing.PointF]::new(642,512), [System.Drawing.PointF]::new(772,512)
  )
  $taskGraphics.DrawLines($taskPen, $taskPoints)
  $taskName = if ($taskKind -eq 'app') { 'clarity-app-icon.png' } else { 'clarity-splash-mark.png' }
  $taskBitmap.Save((Join-Path $taskRoot "assets/images/$taskName"), [System.Drawing.Imaging.ImageFormat]::Png)
  $taskPen.Dispose(); $taskGraphics.Dispose(); $taskBitmap.Dispose()
}
