import { useLocation, Link } from 'react-router-dom';

const AppointmentSentPage = () => {
  const location = useLocation();
  const client = location.state?.client;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-green-700 mb-4">התור שלך התקבל!</h1>
        <p className="text-gray-700 mb-4">
          {client?.name ? `${client.name}, ` : ''}ההזמנה נשלחה לבעלת העסק.
        </p>
        <p className="text-gray-600 mb-6">
          תקבלי הודעת SMS עם אישור או דחייה של התור בהקדם.
        </p>

        <Link
          to="/"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
};

export default AppointmentSentPage;
