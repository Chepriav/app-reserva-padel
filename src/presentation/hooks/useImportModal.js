import { useState, useEffect } from 'react';
import { csvImportService } from '../../services/csvImportService';

/**
 * Manages ImportUsersModal state and handlers:
 * phase progression, CSV validation, and import execution.
 */
export function useImportModal({ visible, onClose, onImport, onComplete }) {
  const [phase, setPhase] = useState('select');
  const [file, setFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentUser, setCurrentUser] = useState(null);
  const [results, setResults] = useState({ success: [], errors: [] });

  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setPhase('select');
        setFile(null);
        setValidationResult(null);
        setImporting(false);
        setProgress({ current: 0, total: 0 });
        setCurrentUser(null);
        setResults({ success: [], errors: [] });
      }, 300);
    }
  }, [visible]);

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPhase('validating');

    const result = await csvImportService.parseCSV(selectedFile);

    if (!result.success) {
      setValidationResult({
        valid: false,
        fileErrors: result.errors,
        validRows: [],
        rowErrors: [],
      });
      setPhase('validate');
      return;
    }

    setValidationResult({
      valid: result.data.length > 0,
      fileErrors: [],
      validRows: result.data,
      rowErrors: result.errors || [],
    });
    setPhase('validate');
  };

  const handleStartImport = async () => {
    if (!validationResult?.validRows || validationResult.validRows.length === 0) {
      return;
    }

    setPhase('importing');
    setImporting(true);
    setProgress({ current: 0, total: validationResult.validRows.length });

    const successList = [];
    const errorList = [];

    await onImport(
      validationResult.validRows,
      (current, total, user) => {
        setProgress({ current, total });
        setCurrentUser(user);
      },
      (user, success, error) => {
        if (success) {
          successList.push(user);
        } else {
          errorList.push({ user, error });
        }
        setResults({ success: successList, errors: errorList });
      }
    );

    setImporting(false);
    setCurrentUser(null);
    onComplete({ success: successList, errors: errorList });
  };

  const handleCancel = () => {
    if (!importing) {
      onClose();
    }
  };

  const handleTryAgain = () => {
    setPhase('select');
    setFile(null);
    setValidationResult(null);
  };

  return {
    phase,
    file,
    validationResult,
    importing,
    progress,
    currentUser,
    results,
    handleFileSelect,
    handleStartImport,
    handleCancel,
    handleTryAgain,
  };
}
