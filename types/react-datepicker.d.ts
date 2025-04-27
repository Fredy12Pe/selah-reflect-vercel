declare module 'react-datepicker' {
  import React from 'react';
  
  export interface ReactDatePickerProps {
    selected?: Date | null;
    onChange?: (date: Date | null, event: React.SyntheticEvent<any> | undefined) => void;
    maxDate?: Date | null;
    inline?: boolean;
    calendarClassName?: string;
    dayClassName?: (date: Date) => string;
    [key: string]: any;
  }
  
  declare const DatePicker: React.FC<ReactDatePickerProps>;
  
  export default DatePicker;
} 