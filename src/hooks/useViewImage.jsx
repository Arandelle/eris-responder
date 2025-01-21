import React, { useState } from 'react';

const useViewImage = () => {
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  const handleImageClick = (imageUri) => {
    setSelectedImageUri(imageUri);
    setIsImageModalVisible(true); // Show the image modal
  };

  const closeImageModal = () => {
    setIsImageModalVisible(false);
    setSelectedImageUri(null);
  };

  return { isImageModalVisible, selectedImageUri, handleImageClick, closeImageModal };
};

export default useViewImage;
