async function runOptimization() {
  console.log('Loading modules...');
  const { glob } = await import('glob');
  const imagemin = (await import('imagemin')).default;
  const imageminWebp = (await import('imagemin-webp')).default;

  const sourceDir = 'public/assets/cardimg';
  const outputDir = 'public/assets/cardimg';

  console.log('Finding PNG files...');
  const files = await glob(`${sourceDir}/*.png`);

  if (files.length === 0) {
    console.log('No PNG files found to optimize.');
    return;
  }
  console.log(`Found ${files.length} PNG files. Starting optimization...`);

  await imagemin(files, {
    destination: outputDir,
    plugins: [
      imageminWebp({
        lossless: true
      })
    ]
  });

  console.log(`Optimization complete! ${files.length} images converted to WebP in ${outputDir}`);
}

runOptimization().catch(console.error);
