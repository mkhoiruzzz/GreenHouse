// utils/categoryIcons.js
export const getCategoryIcon = (kategori) => {
  const iconMap = {
    // Bunga
    'anggrek': '🌸',
    'mawar': '🌹', 
    'melati': '💮',
    'lily': '⚜️',
    'krisan': '❀',
    
    // Daun Hias
    'daun hias': '🍃',
    'monstera': '🍃',
    'philodendron': '💚',
    'calathea': '🎨',
    'begonia': '🌈',
    'aglaonema': '🎯',
    'coleus': '🎭',
    
    // Sukulen & Kaktus
    'sukulen': '🌵',
    'kaktus': '🌵',
    'echeveria': '🔮',
    'haworthia': '💎',
    'sedum': '✨',
    
    // Tanaman Hias Lain
    'bonsai': '🎋',
    'herbal': '🌿',
    'pakis': '🪴',
    'palem': '🌴',
    'sansevieria': '⚡',
    'anthurium': '❤️',
    'kuping gajah': '🐘',
    
    // Default
    'default': '🌿'
  };

  const categoryLower = kategori?.toLowerCase() || '';
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (categoryLower.includes(key)) {
      return icon;
    }
  }
  
  return iconMap.default;
};

export const getCategoryColor = (kategori) => {
  const colorMap = {
    'anggrek': 'text-pink-500',
    'daun hias': 'text-green-500',
    'sukulen': 'text-blue-500',
    'kaktus': 'text-green-600',
    'bonsai': 'text-brown-500',
    'default': 'text-gray-500'
  };

  const categoryLower = kategori?.toLowerCase() || '';
  
  for (const [key, color] of Object.entries(colorMap)) {
    if (categoryLower.includes(key)) {
      return color;
    }
  }
  
  return colorMap.default;
};