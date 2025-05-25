import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const ImageUpload = ({ serviceId }: { serviceId: string }) => {
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `services/${serviceId}/${Date.now()}_${image.name}`);
      await uploadBytes(storageRef, image);
      const url = await getDownloadURL(storageRef);

      const serviceRef = doc(db, 'services', serviceId);
      await updateDoc(serviceRef, {
        gallery: arrayUnion(url),
      });

      alert('✅ תמונה הועלתה בהצלחה!');
      setImage(null);
    } catch (err) {
      console.error('שגיאה בהעלאה:', err);
      alert('❌ שגיאה בהעלאה');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        disabled={!image || loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'מעלה...' : 'העלה תמונה'}
      </button>
    </div>
  );
};

export default ImageUpload;
