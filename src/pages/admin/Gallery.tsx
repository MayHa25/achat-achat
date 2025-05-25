import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Gallery = ({ serviceId }: { serviceId: string }) => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchGallery = async () => {
      const serviceRef = doc(db, 'services', serviceId);
      const snap = await getDoc(serviceRef);
      const data = snap.data();
      setImages(data?.gallery || []);
    };

    fetchGallery();
  }, [serviceId]);

  if (images.length === 0) return <p className="text-gray-500">לא הועלו עדיין תמונות לשירות הזה.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {images.map((url, idx) => (
        <img
          key={idx}
          src={url}
          alt={`תמונה ${idx + 1}`}
          className="rounded shadow border max-h-48 object-cover"
        />
      ))}
    </div>
  );
};

export default Gallery;
