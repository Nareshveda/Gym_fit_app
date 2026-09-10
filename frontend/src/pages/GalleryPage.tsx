import { PublicNavbar } from '../components/layout/PublicNavbar';

const placeholder = [
  '/assets/gallery-01.jpg',
  '/assets/gallery-02.jpg',
  '/assets/gallery-03.jpg',
  '/assets/gallery-04.jpg',
  '/assets/gallery-05.jpg',
  '/assets/gallery-06.jpg',
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase text-muted-foreground">Gallery</p>
          <h1 className="mt-3 text-3xl font-extrabold">A look inside our community</h1>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600">Moments from classes, transformations, and the environment where goals are built.</p>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {placeholder.map((src, idx) => (
            <div key={src} className="aspect-[4/3] w-full overflow-hidden rounded-lg shadow-sm">
              <img src={src} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
