import { useRef, useState } from "react";
import {
    Modal,
    Button,
    Alert,
    Table,
    Typography,
    Divider,
    Spin,
} from "antd";
import { Upload, FileText } from "lucide-react";
import { api } from "@/api/api";
import { API } from "@/api/endpoints";

const { Title, Text } = Typography;

interface Skip {
    row: number | string;
    employeeId: string;
    reason: string;
}

interface ImportResult {
    totalRecordsFound: number;
    successCount: number;
    failedCount: number;
    skips: Skip[];
}

export default function EmployeeImportModal() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [file, setFile] = useState<File | null>(null);

    const [error, setError] = useState("");

    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleImport = async () => {
        if (!file) {
            setError("Please choose a CSV file.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setResult(null);

            const formData = new FormData();
            formData.append("file", file);

            const res = await api.post(`${API.AUTH}/bulk-import`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setResult(res.data);
        } catch (err: any) {
            setError(err.message || "Import failed.");
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setOpen(false);
        setFile(null);
        setResult(null);
        setError("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    const handleRemoveFile = () => {
        setFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    return (
        <>
            <Button
                icon={<Upload size={16} />}
                onClick={() => setOpen(true)}
                className="!h-10 !px-5 !rounded-lg !bg-primary-600 !border-primary-600 hover:!bg-primary-700 hover:!border-primary-700 !text-white !font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
                Import Employees
            </Button>

            <Modal
                open={open}
                onCancel={closeModal}
                footer={null}
                width={700}
                destroyOnClose
                title="Import Employees"
            >
                {!result ? (
                    <>
                        <Alert
                            type="info"
                            showIcon
                            message="Upload Employee CSV"
                            description={
                                <>
                                    <p>The CSV should contain the following columns:</p>
                                    <ul className="list-disc pl-5 mt-2">
                                        <li>Employee Code</li>
                                        <li>Name</li>
                                        <li>Location</li>
                                        <li>Designation</li>
                                    </ul>
                                </>
                            }
                        />

                        <div className="mt-6">
                            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                                <input
                                    type="file"
                                    ref={fileInputRef}

                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />

                                <Upload size={32} className="mx-auto text-gray-400 mb-3" />

                                <p className="font-medium">
                                    {file ? file.name : "Click to choose CSV file"}
                                </p>

                                <p className="text-gray-500 text-sm mt-1">
                                    Only .csv files are supported
                                </p>
                            </label>

                            {file && (
                                <div className="mt-3 flex items-center justify-between rounded border bg-gray-50 px-4 py-2">
                                    <span className="text-sm">{file.name}</span>

                                    <Button
                                        type="link"
                                        danger
                                        onClick={handleRemoveFile}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            )}
                        </div>

                        {error && (
                            <Alert
                                className="mt-5"
                                type="error"
                                showIcon
                                message={error}
                            />
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <Button onClick={closeModal}>
                                Cancel
                            </Button>

                            <Button
                                type="primary"
                                loading={loading}
                                disabled={!file}
                                onClick={handleImport}
                            >
                                Import Employees
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <Alert
                            showIcon
                            type={result.failedCount ? "warning" : "success"}
                            message={
                                result.failedCount
                                    ? "Import completed with some skipped records."
                                    : "All employees imported successfully."
                            }
                        />

                        <div className="grid grid-cols-3 gap-4 my-6">
                            <div className="rounded border p-4 text-center">
                                <div className="text-2xl font-semibold">
                                    {result.totalRecordsFound}
                                </div>
                                <div className="text-gray-500 text-sm">
                                    Total Records
                                </div>
                            </div>

                            <div className="rounded border p-4 text-center">
                                <div className="text-2xl font-semibold text-green-600">
                                    {result.successCount}
                                </div>
                                <div className="text-gray-500 text-sm">
                                    Imported
                                </div>
                            </div>

                            <div className="rounded border p-4 text-center">
                                <div className="text-2xl font-semibold text-red-600">
                                    {result.failedCount}
                                </div>
                                <div className="text-gray-500 text-sm">
                                    Failed
                                </div>
                            </div>
                        </div>

                        {result.failedCount > 0 && (
                            <Table
                                size="small"
                                bordered
                                rowKey={(r) => `${r.row}-${r.employeeId}`}
                                dataSource={result.skips}
                                pagination={{ pageSize: 5 }}
                                columns={[
                                    {
                                        title: "Row",
                                        dataIndex: "row",
                                        width: 80,
                                    },
                                    {
                                        title: "Employee Code",
                                        dataIndex: "employeeId",
                                        width: 180,
                                    },
                                    {
                                        title: "Reason",
                                        dataIndex: "reason",
                                    },
                                ]}
                            />
                        )}

                        <div className="flex justify-end mt-6">
                            <Button type="primary" onClick={closeModal}>
                                Done
                            </Button>
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
}