import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Шрифт по умолчанию в react-pdf (Helvetica) не поддерживает кириллицу —
// подключаем DejaVu Sans (полная поддержка кириллицы), файлы лежат в
// public/fonts и раздаются с того же домена, что и само приложение.
Font.register({
  family: 'DejaVuSans',
  fonts: [
    { src: '/fonts/DejaVuSans.ttf', fontWeight: 'normal' },
    { src: '/fonts/DejaVuSans-Bold.ttf', fontWeight: 'bold' },
  ],
});

type MealType = 'breakfast' | 'lunch' | 'dinner';

type RoomRow = {
  roomNumber: string;
  namesLabel: string;
  counts: Record<MealType, number>;
};

type FloorTable = {
  floor: string;
  rows: RoomRow[];
};

type Props = {
  dateLabel: string;
  mealLabels: Record<MealType, string>;
  floorLabel: string;
  printColumns: FloorTable[][];
};

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 8,
    fontFamily: 'DejaVuSans',
    color: '#262626',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    width: '48%',
  },
  table: {
    marginBottom: 10,
  },
  floorHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    borderBottom: '1.5 solid #262626',
    paddingBottom: 3,
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #262626',
    paddingBottom: 2,
    marginBottom: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #CCCCCC',
    paddingVertical: 2,
  },
  roomCell: {
    width: '52%',
    paddingRight: 3,
  },
  roomNumber: {
    fontWeight: 'bold',
    fontSize: 8,
  },
  roomNames: {
    fontSize: 6.5,
    color: '#606058',
  },
  mealCell: {
    width: '16%',
    textAlign: 'center',
  },
  headerCell: {
    fontSize: 7,
    textAlign: 'center',
    width: '16%',
  },
  headerCellRoom: {
    fontSize: 7,
    width: '52%',
  },
});

// Табличный формат по этажам, 2 колонки на листе, распределённые
// сбалансированно по числу строк (не строго один этаж = одна колонка) —
// без логотипов, для экономии бумаги при печати на кухне.
export default function OrdersPdfDocument({
  dateLabel,
  mealLabels,
  floorLabel,
  printColumns,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{dateLabel}</Text>

        <View style={styles.grid}>
          {printColumns.map((column, colIdx) => (
            <View key={colIdx} style={styles.column}>
              {column.map(({ floor, rows }) => (
                <View key={floor} style={styles.table} wrap={false}>
                  <Text style={styles.floorHeader}>
                    {floorLabel} {floor}
                  </Text>
                  <View style={styles.headerRow}>
                    <Text style={styles.headerCellRoom}>№</Text>
                    <Text style={styles.headerCell}>{mealLabels.breakfast[0]}</Text>
                    <Text style={styles.headerCell}>{mealLabels.lunch[0]}</Text>
                    <Text style={styles.headerCell}>{mealLabels.dinner[0]}</Text>
                  </View>
                  {rows.map((row) => (
                    <View key={row.roomNumber} style={styles.row}>
                      <View style={styles.roomCell}>
                        <Text style={styles.roomNumber}>{row.roomNumber}</Text>
                        <Text style={styles.roomNames}>{row.namesLabel}</Text>
                      </View>
                      <Text style={styles.mealCell}>{row.counts.breakfast}</Text>
                      <Text style={styles.mealCell}>{row.counts.lunch}</Text>
                      <Text style={styles.mealCell}>{row.counts.dinner}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
