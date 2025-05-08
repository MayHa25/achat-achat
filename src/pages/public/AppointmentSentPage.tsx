import { useLocation, Link } from 'react-router-dom';

const AppointmentSentPage = () => {
  const location = useLocation();
  const client = location.state?.client;

  return (
    <div className="container mx-auto px-4 py-10 text-center">
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-4">התור נשלח!</h1>
        <p className="mb-4">
          {client?.name ? `${client.name}, ` : ''}התור שלך התקבל בהצלחה ונשלח לאישור בעלת העסק.
        </p>
        <p className="text-gray-600 mb-6">
          תקבלי הודעה בסמס ברגע שהתור יאושר או יידחה.
        </p>

        <Link
          to="/"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
};

export default AppointmentSentPage;
