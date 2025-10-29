const LoadingSpinner = ({ size = 'medium' }) => {
  const sizes = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  return (
    <div className="flex justify-center items-center py-12">
      <div
        className={`${sizes[size]} border-4 border-secondary border-t-transparent rounded-full animate-spin`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;