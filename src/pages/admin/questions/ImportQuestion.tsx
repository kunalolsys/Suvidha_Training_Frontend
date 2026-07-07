import React, { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle2, FileSpreadsheet, Download } from "lucide-react";
import { api } from "@/api/api";
import { API } from "@/api/endpoints";
import * as XLSX from "xlsx";
import { message } from "antd";

export default function ExcelImportWidget({ videoId, setRefetch }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await api.post(`${API.QUESTION}/import/${videoId}`, formData);

            const resData = response.data;

            // if (resData.errors && resData.errors.length > 0 && resData.imported === 0) {
            //     throw new Error(resData.errors[0]?.reason || "Something went wrong during import.");
            // }

            // message.success(`${resData.imported} questions imported!`);
            setResult(resData);
            if (typeof setRefetch === "function") {
                setRefetch((prev) => !prev);
            }
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to import questions.");
        } finally {
            setLoading(false);
        }
    };

    const downloadExcelTemplate = () => {
        const templateRows = [
            {
                "Question": "What is the primary goal of consultative selling?",
                "Option A": "Building trust and solving client problems",
                "Option B": "Maximizing cold call volume",
                "Option C": "Offering the lowest price",
                "Option D": "Automating email distributions",
                "Correct Option": "A",
                "Sort Order": 1
            },
            {
                "Question": "Which of these is an open-ended question?",
                "Option A": "Do you like your software?",
                "Option B": "What specific challenges are you facing?",
                "Option C": "Is your budget flexible?",
                "Option D": "Are you the decision maker?",
                "Correct Option": "B",
                "Sort Order": 2
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Questions Template");
        XLSX.writeFile(workbook, "questions_template.xlsx");
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Bulk Import Questions</h2>
                    <p className="text-sm text-slate-500">Upload an Excel sheet mapping back to your quiz database.</p>
                </div>

                <button
                    onClick={downloadExcelTemplate}
                    className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition"
                >
                    <Download size={14} />
                    Download Template
                </button>
            </div>

            <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${file ? "border-indigo-500 bg-indigo-50/30" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    className="hidden"
                />

                <div className="flex flex-col items-center justify-center gap-2">
                    <div className={`p-3 rounded-full ${file ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                        <FileSpreadsheet size={24} />
                    </div>
                    {file ? (
                        <div>
                            <p className="text-sm font-medium text-slate-700">{file.name}</p>
                            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm font-medium text-slate-700">Click to upload or drag & drop</p>
                            <p className="text-xs text-slate-400">Only .xlsx and .xls files are supported</p>
                        </div>
                    )}
                </div>
            </div>

            {file && (
                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="w-full mt-4 bg-slate-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Upload size={16} /> Import
                        </>
                    )}
                </button>
            )}

            {error && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex gap-3 items-start text-sm">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div>{error}</div>
                </div>
            )}

            {result && (
                <div className="mt-6 space-y-4">
                    <hr className="border-slate-100" />
                    <h3 className="text-sm font-semibold text-slate-700">Import Summary</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="text-emerald-600" size={20} />
                            <div>
                                <p className="text-2xl font-bold text-emerald-700">{result.imported}</p>
                                <p className="text-xs text-emerald-600 font-medium">Successfully Imported</p>
                            </div>
                        </div>
                        <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl flex items-center gap-3">
                            <AlertCircle className="text-amber-600" size={20} />
                            <div>
                                <p className="text-2xl font-bold text-amber-700">{result.skipped}</p>
                                <p className="text-xs text-amber-600 font-medium">Rows Skipped (Errors)</p>
                            </div>
                        </div>
                    </div>
                    {result.errors && result.errors.length > 0 && (
                        <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">Skipped Row Details</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                                {result.errors.map((err, i) => (
                                    <div key={i} className="px-4 py-2.5 text-xs flex justify-between gap-4 hover:bg-slate-50">
                                        <span className="font-semibold text-slate-500 shrink-0">Row {err.row}</span>
                                        <span className="text-rose-600 text-right font-medium">{err.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}