import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

type MealType = 'breakfast' | 'lunch' | 'dinner';

type OrderItem = {
  id: string;
  mealType: MealType;
  issuedAt: string | null;
  roomNumber: string;
  guestName: string | null;
};

type Props = {
  logoUrl: string;
  dateLabel: string;
  mealLabels: Record<MealType, string>;
  noNameLabel: string;
  issuedLabel: string;
  groupedByRoom: [string, OrderItem[]][];
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#262626',
  },
  logo: {
    width: 90,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  room: {
    marginBottom: 12,
  },
  roomTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    borderBottom: '1 solid #E7E7E3',
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  rowLeft: {
    flexDirection: 'row',
    gap: 6,
  },
  guest: {
    color: '#606058',
  },
  issued: {
    color: '#16a34a',
    fontFamily: 'Helvetica-Bold',
  },
});

// Отдельный react-pdf компонент документа — рендерится в PDF-blob
// прямо в браузере (без puppeteer/серверных headless-браузеров, это
// проще поддерживать на Vercel, как и предполагалось в ТЗ).
export default function OrdersPdfDocument({
  logoUrl,
  dateLabel,
  mealLabels,
  noNameLabel,
  issuedLabel,
  groupedByRoom,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Image src={logoUrl} style={styles.logo} />
        <Text style={styles.title}>{dateLabel}</Text>

        {groupedByRoom.map(([roomNumber, items]) => (
          <View key={roomNumber} style={styles.room} wrap={false}>
            <Text style={styles.roomTitle}>№ {roomNumber}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text>{mealLabels[item.mealType]}</Text>
                  <Text style={styles.guest}>
                    {item.guestName || noNameLabel}
                  </Text>
                </View>
                {item.issuedAt && (
                  <Text style={styles.issued}>✓ {issuedLabel}</Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
