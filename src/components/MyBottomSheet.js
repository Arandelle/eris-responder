import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";

const MyBottomSheet = forwardRef(({children, index}, ref) => {

    const bottomSheetRef = useRef(null);
    const [initialIndex, setInitialIndex] = useState(0);
    const snapPoints = useMemo(() => ["30%", "50%"], []);

    useImperativeHandle(ref, () => ({
      openBottomSheet: () => bottomSheetRef.current?.expand(),
      closeBottomSheet: () => bottomSheetRef.current?.close()
    }))

  return (
    <BottomSheet
    ref={bottomSheetRef}
    index={index ? initialIndex : -1}
    snapPoints={snapPoints}
    enablePanDownToClose={true}
    >
        <BottomSheetView>
            {children}
        </BottomSheetView>
    </BottomSheet>
  )
});

export default MyBottomSheet
