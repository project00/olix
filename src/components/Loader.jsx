// frontend/src/components/Loader.jsx
const Loader = ({ size = 'medium', color = 'blue' }) => {
  const getSize = () => {
    switch(size) {
      case 'small': return 'h-6 w-6 border-2';
      case 'medium': return 'h-8 w-8 border-4';
      case 'large': return 'h-12 w-12 border-4';
      default: return 'h-8 w-8 border-4';
    }
  };

  const getColor = () => {
    switch(color) {
      case 'blue': return 'border-blue-500';
      case 'white': return 'border-white';
      case 'gray': return 'border-gray-500';
      case 'red': return 'border-red-500';
      case 'green': return 'border-green-500';
      default: return 'border-blue-500';
    }
  };

  return (
    <div className={`animate-spin rounded-full ${getSize()} ${getColor()} border-t-transparent`} />
  );
};

export default Loader;
