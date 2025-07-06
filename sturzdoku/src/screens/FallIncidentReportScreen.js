// src/screens/FallIncidentReportScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { saveIncidentReport, BASE_URL } from '../services/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const MAX_LENGTH = 5000;

/* Turn ids like "head_injury" → "Head Injury" */
const humanize = (id) =>
  id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const FallIncidentReportScreen = ({ route, navigation }) => {
  const {
    resident,
    placeOfFall,
    condition,
    vitals,
    aidsPresent = [],
    injuries = [],
    firstAid = []
  } = route.params;

  const [reportText, setReportText] = useState('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  /* Build narrative once on mount */
  useEffect(() => {
    const parts = [];

    parts.push(
      `The patient was found ${humanize(condition).toLowerCase()} in the ${placeOfFall.label.toLowerCase()}.`
    );

    parts.push(
      `A quick body check was administered, blood pressure was measured at ` +
        `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg, ` +
        `blood sugar level at ${vitals.glucoseLevel} mg/dL, temperature at ` +
        `${vitals.temperature.toFixed(1)} °C and oxygen saturation at ` +
        `${vitals.oxygenLevel} %.`
    );

    if (aidsPresent.length) {
      parts.push(
        `At the time of the incident, the resident was using ` +
          `${aidsPresent.map(humanize).join(', ')} on the side.`
      );
    }

    if (firstAid.length) {
      parts.push(
        `First aid measures were performed: ${firstAid.map(humanize).join(', ')}.`
      );
    }

    if (injuries.length) {
      parts.push(
        `Injuries noted: ${injuries.map(humanize).join(', ')}. ` +
          `Emergency responders were informed by telephone.`
      );
    } else {
      parts.push(`No visible injuries were found on the head or body.`);
    }

    setReportText(parts.join(' '));
  }, []);

  /* Save to backend (text only) */
  const handleSave = async () => {
    if (!reportText || saving) return;

    try {
      setSaving(true);
      await saveIncidentReport({
        residentId: resident.id,
        narrative: reportText
      });
      Alert.alert('Success', 'Report saved!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not save report.');
    } finally {
      setSaving(false);
    }
  };

  // Enhanced PDF export function
  const downloadAndOpenPDF = async () => {
    if (exporting) return;

    try {
      setExporting(true);
      console.log('PDF export started with BASE_URL:', BASE_URL);

      // Generate PDF on backend with enhanced data
      const response = await fetch(`${BASE_URL}/api/report/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          residentId: resident.id,
          reportText: reportText,
          // Pass additional data for enhanced PDF
          resident: resident,
          placeOfFall: placeOfFall,
          condition: condition,
          vitals: vitals,
          aidsPresent: aidsPresent,
          injuries: injuries,
          firstAid: firstAid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Server responded with:', data);

      if (!data.url) {
        throw new Error('No PDF URL returned from server');
      }

      // Download PDF to device
      const fileUrl = `${BASE_URL}${data.url}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fall_report_${resident.id}_${timestamp}.pdf`;
      const localUri = `${FileSystem.documentDirectory}${filename}`;

      console.log('Downloading from:', fileUrl);
      console.log('Saving to:', localUri);

      const downloadResult = await FileSystem.downloadAsync(fileUrl, localUri);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }

      console.log('PDF downloaded successfully to:', downloadResult.uri);

      // Verify file exists and has content
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      if (!fileInfo.exists || fileInfo.size === 0) {
        throw new Error('Downloaded file is empty or corrupted');
      }

      console.log('File size:', fileInfo.size, 'bytes');

      // Try to share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Fall Incident Report',
          UTI: 'com.adobe.pdf'
        });
      } else {
        // Fallback: Try to save to media library (requires permission)
        try {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === 'granted') {
            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
            await MediaLibrary.createAlbumAsync('Fall Reports', asset, false);
            Alert.alert(
              'PDF Saved', 
              'Report saved to your device gallery in "Fall Reports" album.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'PDF Downloaded', 
              `Report saved to app directory: ${filename}`,
              [{ text: 'OK' }]
            );
          }
        } catch (mediaError) {
          console.error('Media library error:', mediaError);
          Alert.alert(
            'PDF Downloaded', 
            `Report saved to app directory: ${filename}`,
            [{ text: 'OK' }]
          );
        }
      }

    } catch (err) {
      console.error('PDF export failed:', err);
      Alert.alert(
        'Export Failed', 
        err.message || 'Could not export PDF. Please check your network connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setExporting(false);
    }
  };

  const documents = [
    { key: 'medPlan', label: 'Updated Medication Plan', included: true },
    { key: 'hospReport', label: 'Last Hospital Report', included: false },
    { key: 'transition', label: 'Care Transition Form', included: false },
    { key: 'will', label: 'Living Will', included: false },
    { key: 'poa', label: 'Power Of Attorney', included: false }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fall / Incident Report</Text>
        {!reportText && <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Narrative */}
        {reportText ? (
          <>
            <Text style={styles.reportText}>{reportText}</Text>
            <Text style={styles.counter}>
              {reportText.length}/{MAX_LENGTH}
            </Text>
          </>
        ) : (
          <Text style={styles.generating}>Generating report…</Text>
        )}

        {/* Documents section */}
        <Text style={styles.docsHeading}>Documents Included</Text>
        {documents.map((doc) => (
          <View key={doc.key} style={styles.docRow}>
            <Ionicons
              name={doc.included ? 'heart' : 'heart-outline'}
              size={20}
              color={doc.included ? '#05BFD4' : '#aaa'}
            />
            <Text style={styles.docLabel}>{doc.label}</Text>
          </View>
        ))}

        {/* Save button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={24} color="#fff" />
              <Text style={styles.saveText}>Save</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Export PDF button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: '#05BFD4' }]}
          onPress={downloadAndOpenPDF}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={24} color="#fff" />
              <Text style={styles.saveText}>Export PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default FallIncidentReportScreen;

/* ───────── styles ───────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#2689F2',
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center'
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  body: { padding: 20, paddingBottom: 100 },
  generating: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20
  },
  reportText: { fontSize: 14, lineHeight: 20, color: '#222' },
  counter: { textAlign: 'right', marginTop: 8, color: '#666' },

  docsHeading: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '600',
    color: '#05BFD4'
  },
  docRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  docLabel: { marginLeft: 8, fontSize: 14, color: '#444' },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2689F2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'center',
    marginTop: 32
  },
  saveText: { color: '#fff', marginLeft: 8, fontWeight: '600' }
});