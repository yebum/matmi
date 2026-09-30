Add-Type -AssemblyName System.Drawing
$fixtureRoot = Join-Path (Get-Location) 'tests\fixtures'
New-Item -ItemType Directory -Force -Path $fixtureRoot | Out-Null
$menus = @{
  'a-langos' = @('LÁNGOS 2800 FT', 'GULYAS 3900 FT', 'HURKA 3500 FT')
  'b-pho-pad-thai' = @('PHỞ BÒ 12', 'PAD THAI 14')
  'c-three-dishes' = @('NASI GORENG 15', 'LÁNGOS 2800 FT', 'TTEOKBOKKI 16', 'LANGOS 2800 FT')
  'd-unsupported' = @('GULYAS 3900 FT', 'HURKA 3500 FT', 'PAPRIKASH 4200 FT')
  'all-five' = @('TTEOKBOKKI', 'PHỞ', 'PAD THAI', 'NASI GORENG', 'LÁNGOS')
}
foreach ($name in $menus.Keys) {
  $bitmap = [System.Drawing.Bitmap]::new(1200, 800)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $font = [System.Drawing.Font]::new('Arial', 48, [System.Drawing.FontStyle]::Bold)
  $brush = [System.Drawing.Brushes]::Black
  $graphics.DrawString('TODAY''S MENU', $font, $brush, 60, 40)
  $y = 160
  foreach ($line in $menus[$name]) { $graphics.DrawString($line, $font, $brush, 60, $y); $y += 105 }
  $bitmap.Save((Join-Path $fixtureRoot "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $font.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
$large = [System.Drawing.Bitmap]::new(6000, 4000)
$largeGraphics = [System.Drawing.Graphics]::FromImage($large)
$largeGraphics.Clear([System.Drawing.Color]::White)
$largeGraphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$largeFont = [System.Drawing.Font]::new('Arial', 180, [System.Drawing.FontStyle]::Bold)
$largeGraphics.DrawString('TODAY''S MENU', $largeFont, [System.Drawing.Brushes]::Black, 300, 300)
$largeGraphics.DrawString('LÁNGOS 2800 FT', $largeFont, [System.Drawing.Brushes]::Black, 300, 900)
$large.Save((Join-Path $fixtureRoot 'large-langos.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$largeFont.Dispose(); $largeGraphics.Dispose(); $large.Dispose()
