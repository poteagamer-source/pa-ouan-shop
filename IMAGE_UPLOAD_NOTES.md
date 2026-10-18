# Product image uploads

- Manager forms for products and toppings accept JPEG, PNG and WebP up to 5 MB.
- `POST /api/images` requires a manager session and accepts binary image content.
- The API decodes and validates images with sharp, rejects animated/unsupported
  images and inputs over 24 million pixels, applies orientation, strips metadata,
  resizes within 800 × 800 without enlargement, and converts to WebP ≤ 200 KB.
- `product_images` stores binary WebP in the existing PostgreSQL database.
  SHA-256 keys deduplicate identical optimized uploads. Products/toppings retain
  only a URL. Public image responses are immutable and cached for one year.
- Run the existing `npm run db:migrate` on deployment before serving uploads.
  The schema addition creates a table; it does not rewrite existing product images.
- Images survive app rebuilds and restarts while the database is retained. They
  consume database storage: 1,000 images at the maximum size use about 200 MB
  before database overhead. An object-storage service can replace this later.
- Upload happens before saving a product. Cancelled forms may leave uploaded
  images in storage. Old images are retained to preserve historical order images;
  automatic deletion is not implemented. Re-uploading identical optimized images
  does not create duplicate rows.
- Validation: image conversion unit tests and browser upload/error tests use
  generated images and mocked HTTP responses; they do not write production data.
