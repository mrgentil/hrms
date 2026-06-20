"use client";

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportButtonsProps {
  data: any[];
  columns: { header: string; key: string | ((row: any) => any) }[];
  filename: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ data, columns, filename }) => {
  const [isExporting, setIsExporting] = useState(false);

  // Prepare data matrix for both exports
  const getMatrixData = () => {
    return data.map((row) =>
      columns.map((col) => {
        if (typeof col.key === 'function') {
          return col.key(row) || '';
        }
        return row[col.key] || '';
      })
    );
  };

  const headers = columns.map(col => col.header);

  const exportToPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text(filename, 14, 15);
      doc.setFontSize(10);
      doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 14, 22);

      const tableData = getMatrixData();

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] } // Tailwind blue-500
      });

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Erreur export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    try {
      setIsExporting(true);
      const tableData = getMatrixData();
      
      // Add headers
      tableData.unshift(headers);
      
      const worksheet = XLSX.utils.aoa_to_sheet(tableData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
      
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
      console.error('Erreur export Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToPDF}
        disabled={isExporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-red-200 dark:border-red-800/30 disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        PDF
      </button>
      <button
        onClick={exportToExcel}
        disabled={isExporting}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30 rounded-lg transition-colors border border-green-200 dark:border-green-800/30 disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Excel
      </button>
    </div>
  );
};
