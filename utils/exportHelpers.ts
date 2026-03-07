
import { Alert, Platform } from 'react-native';

const toCSV = (data: any[]): string => {
  if (!data || data.length === 0) {
    return '';
  }
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
};

export const exportDataToCSV = async (data: any[], filename: string) => {
  const csvData = toCSV(data);
  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export failed", e);
      Alert.alert('Export Failed', 'Could not export data.');
    }
  } else {
    console.log(`--- CSV Data for ${filename} ---`);
    console.log(csvData);
    Alert.alert(
      'Data Exported',
      'CSV data has been logged to your development console. You can copy it from there.'
    );
  }
};
