import React, { useState } from 'react';
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

const MyBottomSheet = ({children}) => {

    const [initialIndex, setInitialIndex] = useState(0);

  return (
    <BottomSheet>
        <BottomSheetView>
            {children}
        </BottomSheetView>
    </BottomSheet>
  )
}

export default MyBottomSheet
