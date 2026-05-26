interface ErrorMessageProps {
  title: string;
  message: string;
}

export default function ErrorMessage({ title, message }: ErrorMessageProps) {
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-xl font-semibold text-red-700 mb-2">{title}</h2>
      <p className="text-red-600">{message}</p>
    </div>
  );
}
