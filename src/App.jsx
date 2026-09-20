import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertOctagon,
  Mail,
  Lock,
  LogOut,
  History,
  Download
} from 'lucide-react';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function RootApp() {
  const [token, setToken] = useState(
    localStorage.getItem('token') || null
  );

  if (!token) {
    return <AuthScreen setToken={setToken} />;
  }

  return <MainDashboard setToken={setToken} />;
}

// ==================== AUTH SCREEN ====================
function AuthScreen({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!isLogin && password.length < 8) {
    setError('Password must be at least 8 characters long');
    return;
  }

  setLoading(true);
  setError('');

  const endpoint = isLogin
    ? '/api/v1/auth/login'
    : '/api/v1/auth/register';

    try {
      const response = await fetch(
        `http://localhost:8080${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      if (!response.ok) {
        throw new Error(
          isLogin
            ? 'Invalid email or password'
            : 'Registration failed'
        );
      }

      const data = await response.json();

      const authToken =
        data.token || 'mock-jwt-token-12345';

      localStorage.setItem(
        'token',
        authToken
      );

      localStorage.setItem(
        'userEmail',
        email
      );

      setToken(authToken);

    } catch (err) {
      setError(
        err.message ||
        'Server connection error'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">

        <div className="text-center space-y-2">

          <div className="inline-flex p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20 mb-2">
            <ShieldAlert size={32} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Extension Risk Observatory
          </h1>

          <p className="text-xs text-slate-400">
            Secure Supply-Chain Analysis Platform
          </p>

        </div>

        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">

          <button
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            className={`py-2 rounded-md transition-colors ${
              isLogin
                ? 'bg-cyan-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Login
          </button>

          <button
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            className={`py-2 rounded-md transition-colors ${
              !isLogin
                ? 'bg-cyan-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>

        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 text-center">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <div className="space-y-1">

            <label className="text-xs font-medium text-slate-300">
              Email Address
            </label>

            <div className="relative">

              <Mail
                className="absolute left-3 top-3 text-slate-500"
                size={16}
              />

              <input
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />

            </div>

          </div>

          <div className="space-y-1">

            <label className="text-xs font-medium text-slate-300">
              Password
            </label>

            <div className="relative">

              <Lock
                className="absolute left-3 top-3 text-slate-500"
                size={16}
              />

              <input
                type="password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="enter at least 8 characters"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
          >

            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              isLogin
                ? 'Sign In to Dashboard'
                : 'Create Account'
            )}

          </button>

        </form>

      </div>

    </div>
  );
}

// ==================== MAIN DASHBOARD ====================
function MainDashboard({ setToken }) {

  const [selectedTab, setSelectedTab] =
    useState('diff');

  const [adminDecision, setAdminDecision] =
    useState(null);

  const [scanHistory, setScanHistory] =
    useState([]);

  const [auditLogs, setAuditLogs] =
    useState([]);

  const [auditLoading, setAuditLoading] =
    useState(false);

  const fileInputRef =
    useRef(null);

  const reportRef =
    useRef(null);

  const [loading, setLoading] =
    useState(false);

  const [scanData, setScanData] =
    useState(null);

  const [dragOver, setDragOver] =
    useState(false);

  const [showReportPreview, setShowReportPreview] =
    useState(false);

  const [stats, setStats] = useState({
    extensionsScanned: 0,
    highRiskDetected: 0,
    avgScanTime: "0.0s",
    allowlisted: 0
  });

  // ==================== INITIAL LOAD ====================
  useEffect(() => {
    fetchStats();
    fetchHistory();
    fetchAuditLogs();
  }, []);

  // ==================== FETCH STATS ====================
  const fetchStats = async () => {

    try {

      const userEmail =
        localStorage.getItem('userEmail') || '';

      const response = await fetch(
        `http://localhost:8080/api/v1/extensions/stats?userEmail=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'Authorization':
              `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {

        const data =
          await response.json();

        setStats(data);

      }

    } catch (err) {

      console.error(
        "Failed to fetch live stats:",
        err
      );

    }
  };

  // ==================== FETCH SCAN HISTORY ====================
  const fetchHistory = async () => {

    try {

      const userEmail =
        localStorage.getItem('userEmail') || '';

      const response = await fetch(
        `http://localhost:8080/api/v1/scans/history?userEmail=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'Authorization':
              `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {

        const data =
          await response.json();

        setScanHistory(data);

      }

    } catch (err) {

      console.error(
        "Failed to fetch scan history:",
        err
      );

    }
  };

  // ==================== FETCH AUDIT LOGS ====================
  const fetchAuditLogs = async () => {

    setAuditLoading(true);

    try {

      const userEmail =
        localStorage.getItem('userEmail') || '';

      const response = await fetch(
        `http://localhost:8080/api/v1/audit-logs?userEmail=${encodeURIComponent(userEmail)}`,
        {
          headers: {
            'Authorization':
              `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {

        const data =
          await response.json();

        setAuditLogs(data);

      } else {

        console.error(
          "Audit log request failed:",
          response.status
        );

      }

    } catch (err) {

      console.error(
        "Failed to fetch audit logs:",
        err
      );

    } finally {

      setAuditLoading(false);

    }
  };

  // ==================== FILE UPLOAD ====================
  const handleButtonClick = () => {

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }

  };

  const processUploadedFile =
    async (file) => {

      if (!file) return;

      setLoading(true);
      setAdminDecision(null);

      const formData =
        new FormData();

      formData.append(
        'file',
        file
      );

      formData.append(
        'userEmail',
        localStorage.getItem('userEmail') ||
          'anonymous'
      );

      try {

        const response =
          await fetch(
            'http://localhost:8080/api/v1/extensions/upload',
            {
              method: 'POST',
              headers: {
                'Authorization':
                  `Bearer ${localStorage.getItem('token')}`
              },
              body: formData
            }
          );

        if (!response.ok) {

          throw new Error(
            `Upload failed with status ${response.status}`
          );

        }

        const data =
          await response.json();

        setScanData(data);

        await fetchStats();
        await fetchHistory();
        await fetchAuditLogs();

      } catch (error) {

        console.error(
          "Upload error:",
          error
        );

        alert(
          "Failed to connect to Spring Boot backend server."
        );

      } finally {

        setLoading(false);

      }

    };

  const handleFileChange =
    async (event) => {

      const file =
        event.target.files[0];

      await processUploadedFile(file);

      event.target.value = '';

    };

  const handleDragOver =
    (e) => {

      e.preventDefault();
      setDragOver(true);

    };

  const handleDragLeave =
    () => {

      setDragOver(false);

    };

  const handleDrop =
    async (e) => {

      e.preventDefault();
      setDragOver(false);

      if (
        e.dataTransfer.files &&
        e.dataTransfer.files.length > 0
      ) {

        await processUploadedFile(
          e.dataTransfer.files[0]
        );

      }

    };

  // ==================== LOGOUT ====================
  const handleLogout = () => {

    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');

    setToken(null);

  };

  // ==================== ANALYSIS DATA ====================
  const analysis =
    scanData?.analysis || {};

  const permissions =
    Array.isArray(analysis.permissions)
      ? analysis.permissions
      : [];

  const riskExplanations =
    Array.isArray(
      analysis.riskExplanations
    )
      ? analysis.riskExplanations
      : [];

  const riskScore =
    typeof analysis.riskScore === 'number'
      ? analysis.riskScore
      : (
          scanData?.riskScore ??
          (scanData ? 20 : 0)
        );

  const extensionName =
    analysis.name ||
    scanData?.extensionName ||
    (
      scanData
        ? scanData.filename
        : "No Extension Selected"
    );

  const recommendation =
    analysis.recommendation ||
    "REVIEW";

  const permissionFindings =
    Array.isArray(
      analysis.permissionFindings
    )
      ? analysis.permissionFindings
      : [];

  const excessivePermissions =
    Array.isArray(
      analysis.excessivePermissions
    )
      ? analysis.excessivePermissions
      : [];

  const leastPrivilegeScore =
    typeof analysis.leastPrivilegeScore === 'number'
      ? analysis.leastPrivilegeScore
      : 100;

  const leastPrivilegeLabel =
    leastPrivilegeScore >= 80
      ? 'GOOD'
      : leastPrivilegeScore >= 50
        ? 'REVIEW'
        : 'WEAK';

  // ==================== REMOTE DOMAIN ====================
  const remoteDomains =
    Array.isArray(analysis.remoteDomains)
      ? analysis.remoteDomains
      : [];

  const remoteDomainCount =
    typeof analysis.remoteDomainCount === 'number'
      ? analysis.remoteDomainCount
      : remoteDomains.length;

  // ==================== PDF ====================
  const handleDownloadPDF =
    () => {

      if (!scanData) {

        alert(
          "No scan data available to download."
        );

        return;
      }

      const doc =
        new jsPDF();

      const reportDate =
        new Date().toLocaleString();

      const resolvedExtensionName =
        scanData.filename ||
        analysis.name ||
        "Unknown Extension";

      const resolvedRiskScore =
        typeof (
          scanData.riskScore ||
          analysis.riskScore
        ) === 'number'
          ? (
              scanData.riskScore ||
              analysis.riskScore
            )
          : 50;

      const resolvedPermissions =
        permissions.length > 0
          ? permissions
          : (
              scanData.permissions ||
              []
            );

      const status =
        adminDecision ||
        scanData.status ||
        "PENDING";

      const resolvedVersionDiff =
        analysis.versionDiff ||
        scanData.versionDiff ||
        "No diff output generated.";

      const resolvedSbomFindings =
        analysis.sbomFindings ||
        scanData.sbomFindings ||
        "No SBOM data available.";

      const resolvedPermissionFindings =
        Array.isArray(
          analysis.permissionFindings
        )
          ? analysis.permissionFindings
          : [];

      const resolvedExcessivePermissions =
        Array.isArray(
          analysis.excessivePermissions
        )
          ? analysis.excessivePermissions
          : [];

      const resolvedLeastPrivilegeScore =
        typeof analysis.leastPrivilegeScore === 'number'
          ? analysis.leastPrivilegeScore
          : 100;

      const fileHash =
        scanData.hash ||
        analysis.hash ||
        scanData.sha256 ||
        "N/A";

      let yPos = 20;

      // ==================== HEADER ====================
      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(18);

      doc.setTextColor(
        15,
        23,
        42
      );

      doc.text(
        "Browser Extension Risk Observatory",
        14,
        yPos
      );

      yPos += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(9);

      doc.setTextColor(
        100,
        116,
        139
      );

      doc.text(
        `Generated On: ${reportDate} | Platform Security Audit Trail`,
        14,
        yPos
      );

      yPos += 6;

      doc.setDrawColor(
        226,
        232,
        240
      );

      doc.setLineWidth(0.5);

      doc.line(
        14,
        yPos,
        196,
        yPos
      );

      yPos += 10;

      // ==================== EXECUTIVE SUMMARY ====================
      doc.setFillColor(
        248,
        250,
        252
      );

      doc.setDrawColor(
        226,
        232,
        240
      );

      doc.roundedRect(
        14,
        yPos,
        182,
        38,
        3,
        3,
        'FD'
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(11);

      doc.setTextColor(
        15,
        23,
        42
      );

      doc.text(
        "Executive Summary",
        20,
        yPos + 8
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(9);

      doc.setTextColor(
        51,
        65,
        85
      );

      doc.text(
        `Extension: ${resolvedExtensionName}`,
        20,
        yPos + 16
      );

      doc.text(
        `SHA-256 Hash: ${fileHash.substring(0, 28)}...`,
        20,
        yPos + 23
      );

      doc.text(
        `Composite Risk Score: ${resolvedRiskScore} / 100`,
        20,
        yPos + 30
      );

      doc.text(
        `Admin Decision: ${status}`,
        20,
        yPos + 37
      );

      yPos += 46;

      // ==================== SEVERITY ====================
      const isHighRisk =
        resolvedRiskScore > 50;

      doc.setFillColor(
        isHighRisk ? 254 : 236,
        isHighRisk ? 242 : 253,
        isHighRisk ? 242 : 245
      );

      doc.setDrawColor(
        isHighRisk ? 254 : 167,
        isHighRisk ? 202 : 243,
        isHighRisk ? 202 : 208
      );

      doc.roundedRect(
        14,
        yPos,
        182,
        14,
        2,
        2,
        'FD'
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(9);

      doc.setTextColor(
        isHighRisk ? 185 : 22,
        isHighRisk ? 28 : 101,
        isHighRisk ? 28 : 52
      );

      doc.text(
        isHighRisk
          ? "WARNING: Elevating permissions / moderate-high exposure detected."
          : "STATUS CHECK: Risk score within nominal operating threshold.",
        20,
        yPos + 9
      );

      yPos += 20;

      // ==================== PERMISSIONS ====================
      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(12);

      doc.setTextColor(
        15,
        23,
        42
      );

      doc.text(
        "Detected Permissions & APIs",
        14,
        yPos
      );

      yPos += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(9);

      doc.setTextColor(
        51,
        65,
        85
      );

      if (
        resolvedPermissions.length > 0
      ) {

        resolvedPermissions.forEach(
          (p, i) => {

            if (yPos > 275) {

              doc.addPage();
              yPos = 20;

            }

            doc.setFillColor(
              241,
              245,
              249
            );

            doc.roundedRect(
              18,
              yPos - 4,
              174,
              7,
              1,
              1,
              'F'
            );

            doc.text(
              `${i + 1}. ${p} (manifest.json declaration)`,
              22,
              yPos
            );

            yPos += 9;

          }
        );

      } else {

        doc.text(
          "No specific permissions recorded.",
          18,
          yPos
        );

        yPos += 7;

      }

      yPos += 6;

      // ==================== LEAST PRIVILEGE ====================
      if (yPos > 230) {

        doc.addPage();
        yPos = 20;

      }

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(12);

      doc.setTextColor(
        15,
        23,
        42
      );

      doc.text(
        "Least-Privilege Permission Analysis",
        14,
        yPos
      );

      yPos += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(9);

      doc.setTextColor(
        51,
        65,
        85
      );

      doc.text(
        `Least-Privilege Score: ${resolvedLeastPrivilegeScore} / 100`,
        18,
        yPos
      );

      yPos += 6;

      doc.text(
        `Excessive Permissions: ${resolvedExcessivePermissions.length}`,
        18,
        yPos
      );

      yPos += 8;

      if (
        resolvedPermissionFindings.length > 0
      ) {

        resolvedPermissionFindings.forEach(
          (finding) => {

            const line =
              `${finding.permission || 'Unknown'} | ` +
              `${finding.category || 'Uncategorized'} | ` +
              `${finding.severity || 'UNKNOWN'} | ` +
              `${finding.excessive ? 'EXCESSIVE' : 'OK'}`;

            const reason =
              finding.reason ||
              'No explanation provided.';

            const lines =
              doc.splitTextToSize(
                `${line}\n${reason}`,
                172
              );

            const blockHeight =
              Math.max(
                12,
                lines.length * 4.2 + 5
              );

            if (
              yPos + blockHeight > 280
            ) {

              doc.addPage();
              yPos = 20;

            }

            doc.setFillColor(
              248,
              250,
              252
            );

            doc.setDrawColor(
              226,
              232,
              240
            );

            doc.roundedRect(
              14,
              yPos - 3,
              182,
              blockHeight,
              2,
              2,
              'FD'
            );

            doc.setFont(
              "courier",
              "bold"
            );

            doc.setFontSize(7.5);

            doc.setTextColor(
              15,
              23,
              42
            );

            let findingY =
              yPos + 3;

            lines.forEach(
              (lineText) => {

                doc.text(
                  lineText,
                  18,
                  findingY
                );

                findingY += 4.2;

              }
            );

            yPos +=
              blockHeight + 4;

          }
        );

      } else {

        doc.text(
          "No least-privilege findings returned by the analysis engine.",
          18,
          yPos
        );

        yPos += 7;

      }

      yPos += 5;

      // ==================== REMOTE DOMAINS ====================
      if (yPos > 230) {

        doc.addPage();
        yPos = 20;

      }

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.setFontSize(12);

      doc.setTextColor(
        15,
        23,
        42
      );

      doc.text(
        "Remote-Domain Inventory",
        14,
        yPos
      );

      yPos += 7;

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(9);

      doc.setTextColor(
        51,
        65,
        85
      );

      doc.text(
        `Remote Domains Detected: ${remoteDomainCount}`,
        18,
        yPos
      );

      yPos += 8;

      if (
        remoteDomains.length > 0
      ) {

        remoteDomains.forEach(
          (domain) => {

            const domainLine =
              `${domain.domain || 'Unknown Domain'} | ` +
              `${domain.scheme || 'HTTPS'} | ` +
              `${domain.scope || 'Unknown Scope'} | ` +
              `${domain.riskLevel || 'UNKNOWN'}`;

            const sourceLine =
              `Source: ${domain.source || 'Manifest'}`;

            const lines =
              doc.splitTextToSize(
                `${domainLine}\n${sourceLine}`,
                172
              );

            const blockHeight =
              Math.max(
                14,
                lines.length * 4.5 + 6
              );

            if (
              yPos + blockHeight > 280
            ) {

              doc.addPage();
              yPos = 20;

            }

            doc.setFillColor(
              248,
              250,
              252
            );

            doc.setDrawColor(
              226,
              232,
              240
            );

            doc.roundedRect(
              14,
              yPos - 3,
              182,
              blockHeight,
              2,
              2,
              'FD'
            );

            doc.setFont(
              "courier",
              "normal"
            );

            doc.setFontSize(8);

            doc.setTextColor(
              15,
              23,
              42
            );

            let domainY =
              yPos + 3;

            lines.forEach(
              (lineText) => {

                doc.text(
                  lineText,
                  18,
                  domainY
                );

                domainY += 4.5;

              }
            );

            yPos +=
              blockHeight + 4;

          }
        );

      } else {

        doc.text(
          "No remote domains detected in the extension manifest.",
          18,
          yPos
        );

        yPos += 7;

      }

      yPos += 5;

      // ==================== CODE BLOCK HELPER ====================
      const renderCodeBlock =
        (
          title,
          contentText
        ) => {

          if (yPos > 230) {

            doc.addPage();
            yPos = 20;

          }

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(12);

          doc.setTextColor(
            15,
            23,
            42
          );

          doc.text(
            title,
            14,
            yPos
          );

          yPos += 6;

          const lines =
            doc.splitTextToSize(
              contentText,
              172
            );

          const blockHeight =
            Math.max(
              16,
              lines.length * 4.5 + 8
            );

          if (
            yPos + blockHeight > 280
          ) {

            doc.addPage();
            yPos = 20;

          }

          doc.setFillColor(
            15,
            23,
            42
          );

          doc.setDrawColor(
            51,
            65,
            85
          );

          doc.roundedRect(
            14,
            yPos,
            182,
            blockHeight,
            2,
            2,
            'FD'
          );

          doc.setFont(
            "courier",
            "normal"
          );

          doc.setFontSize(8);

          doc.setTextColor(
            226,
            232,
            240
          );

          let codeY =
            yPos + 6;

          lines.forEach(
            (line) => {

              doc.text(
                line,
                18,
                codeY
              );

              codeY += 4.5;

            }
          );

          yPos +=
            blockHeight + 8;

        };

      renderCodeBlock(
        "Version Diff / Manifest Changes",
        resolvedVersionDiff
      );

      renderCodeBlock(
        "Software Bill of Materials (SBOM) Findings",
        resolvedSbomFindings
      );

      const safeFilename =
        resolvedExtensionName
          .replace(
            /[^a-z0-9]/gi,
            '_'
          )
          .toLowerCase();

      doc.save(
        `scan_report_${safeFilename}_${Date.now()}.pdf`
      );

    };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-screen bg-slate-950 text-slate-100 font-sans p-6 transition-colors ${
        dragOver
          ? 'bg-cyan-950/30 border-2 border-dashed border-cyan-400'
          : ''
      }`}
    >

      <div
        ref={reportRef}
        className="space-y-6 max-w-7xl mx-auto"
      >

        {/* ==================== HEADER ==================== */}
        <header className="flex justify-between items-center pb-6 border-b border-slate-800">

          <div>

            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">

              <ShieldAlert className="text-cyan-400" />

              Browser Extension Risk Observatory

            </h1>

            <p className="text-sm text-slate-400">
              Supply-Chain Risk & Permission Analysis Engine
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-xs text-slate-300">

              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>

              <span className="font-mono">
                {localStorage.getItem('userEmail') ||
                  'analyst@security.com'}
              </span>

            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".zip,.crx"
              className="hidden"
            />

            <button
              onClick={handleButtonClick}
              disabled={loading}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >

              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Analyzing Package...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload Package
                </>
              )}

            </button>

            <button
              onClick={() => {

                if (!scanData) {

                  alert(
                    "No scan data available."
                  );

                  return;

                }

                setShowReportPreview(true);

              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              <FileCode size={16} />
              Preview Report
            </button>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut size={18} />
            </button>

          </div>

        </header>

        {/* ==================== ACTIVE SCAN ==================== */}
        {scanData && (

          <div className="mt-4 p-4 bg-slate-900 border border-cyan-500/30 rounded-lg text-xs font-mono text-cyan-300 flex justify-between items-center">

            <div>

              <span className="text-white font-bold">
                Active Scan:
              </span>

              <span>
                {scanData.filename ||
                  extensionName}
              </span>

              {' | '}

              <span className="text-emerald-400 font-semibold">
                Status: {scanData.status ||
                  'COMPLETED'}
              </span>

              {' | '}

              <span>
                Scan ID: {scanData.scanId ||
                  'N/A'}
              </span>

            </div>

            <button
              onClick={() =>
                setScanData(null)
              }
              className="text-slate-400 hover:text-white ml-4"
            >
              ✕
            </button>

          </div>

        )}

        {/* ==================== METRICS ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">

          <MetricCard
            title="Extensions Scanned"
            value={stats.extensionsScanned}
            sub="Total packages in DB"
            icon={
              <FileCode className="text-blue-400" />
            }
          />

          <MetricCard
            title="High Risk Detected"
            value={stats.highRiskDetected}
            sub="Score > 35/100"
            icon={
              <AlertTriangle className="text-amber-400" />
            }
          />

          <MetricCard
            title="Avg Scan Time"
            value={stats.avgScanTime}
            sub="Syft + Grype processing"
            icon={
              <Clock className="text-emerald-400" />
            }
          />

          <MetricCard
            title="Allowlisted"
            value={stats.allowlisted}
            sub="Passed policy check"
            icon={
              <ShieldCheck className="text-cyan-400" />
            }
          />

        </div>

        {/* ==================== MAIN CONTENT ==================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ==================== LEFT PANEL ==================== */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">

            <div className="flex flex-col gap-2">

              <div>

                <h2 className="text-lg font-bold text-white">
                  {extensionName}
                </h2>

                <span className="text-xs text-slate-400">
                  Version: {analysis.version ||
                    "1.0.0"} |
                  Manifest V{analysis.manifestVersion ||
                    "3"}
                </span>

              </div>

              <div className="pt-2">

                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1.5">
                  Automated Policy Verdict:
                </span>

                <div>

                  {recommendation ===
                    'INSTALL' && (

                    <div className="py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-2">

                      <CheckCircle size={14} />

                      INSTALL (Low Risk)

                    </div>

                  )}

                  {recommendation ===
                    'REVIEW' && (

                    <div className="py-2 px-3 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center gap-2">

                      <AlertTriangle size={14} />

                      REVIEW (Medium Risk)

                    </div>

                  )}

                  {recommendation ===
                    'BLOCK' && (

                    <div className="py-2 px-3 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center gap-2">

                      <XCircle size={14} />

                      BLOCK (High Risk)

                    </div>

                  )}

                </div>

              </div>

            </div>

            {/* ==================== RISK SCORE ==================== */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">

              <span className="text-xs uppercase tracking-wider text-slate-400">
                Composite Risk Score
              </span>

              <div
                className={`text-4xl font-extrabold my-1 ${
                  riskScore > 50
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {riskScore} / 100
              </div>

              <p className="text-xs text-slate-400 font-medium">

                {riskScore > 50
                  ? "High Risk: Elevating permissions found"
                  : "Low Risk: Minimal permissions detected"}

              </p>

            </div>

            {/* ==================== PERMISSIONS ==================== */}
            <div className="space-y-3">

              <h3 className="text-sm font-semibold text-slate-300">
                Parsed Permissions
              </h3>

              {permissions.length > 0 ? (

                permissions.map(
                  (perm, idx) => (

                    <FindingItem
                      key={idx}
                      label={perm}
                      detail="Declared in manifest.json"
                      points="+10"
                      color="text-amber-400"
                    />

                  )
                )

              ) : (

                <p className="text-xs text-slate-500">
                  No active scan or permissions extracted.
                </p>

              )}

            </div>

            {/* ==================== DECISION ==================== */}
            <div className="pt-4 border-t border-slate-800 space-y-3">

              <h3 className="text-sm font-semibold text-slate-300">
                Risk Decision
              </h3>

              <div className="grid grid-cols-2 gap-2">

                {/* ==================== ALLOWLIST ==================== */}
                <button
                  onClick={async () => {

                    setAdminDecision(
                      'ALLOWLISTED'
                    );

                    const userEmail =
                      localStorage.getItem(
                        'userEmail'
                      ) || '';

                    const scanId =
                      scanData?.scanId;

                    const filename =
                      scanData?.filename ||
                      'extension.zip';

                    try {

                      const response =
                        await fetch(
                          'http://localhost:8080/api/v1/extensions/allowlist',
                          {
                            method: 'POST',

                            headers: {
                              'Content-Type':
                                'application/json',

                              'Authorization':
                                `Bearer ${localStorage.getItem('token')}`
                            },

                            body:
                              JSON.stringify({
                                scanId,
                                filename,
                                userEmail
                              })
                          }
                        );

                      if (!response.ok) {

                        throw new Error(
                          'Allowlist request failed'
                        );

                      }

                      const data =
                        await response.json();

                      console.log(
                        'Allowlisted successfully:',
                        data.message
                      );

                      await fetchStats();
                      await fetchHistory();
                      await fetchAuditLogs();

                      alert(
                        `${filename} has been successfully allowlisted.`
                      );

                    } catch (err) {

                      console.error(
                        'Error during allowlist:',
                        err
                      );

                      setAdminDecision(
                        null
                      );

                      alert(
                        'Could not allowlist the extension.'
                      );

                    }

                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
                    adminDecision ===
                    'ALLOWLISTED'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950'
                      : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-600/30'
                  }`}
                >

                  <CheckCircle size={14} />

                  Allowlist

                </button>

                {/* ==================== REJECT ==================== */}
                <button
                  onClick={async () => {

                    setAdminDecision(
                      'REJECTED'
                    );

                    try {

                      const response =
                        await fetch(
                          'http://localhost:8080/api/v1/extensions/reject',
                          {
                            method: 'POST',

                            headers: {
                              'Content-Type':
                                'application/json',

                              'Authorization':
                                `Bearer ${localStorage.getItem('token')}`
                            },

                            body:
                              JSON.stringify({
                                scanId:
                                  scanData?.scanId,

                                filename:
                                  scanData?.filename ||
                                  'extension.zip',

                                userEmail:
                                  localStorage.getItem(
                                    'userEmail'
                                  ) || ''
                              })
                          }
                        );

                      if (response.ok) {

                        const data =
                          await response.json();

                        console.log(
                          "Rejected successfully:",
                          data.message
                        );

                      }

                      await fetchStats();
                      await fetchAuditLogs();

                    } catch (err) {

                      console.error(
                        "Error rejecting extension:",
                        err
                      );

                    }

                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
                    adminDecision ===
                    'REJECTED'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950'
                      : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border-rose-600/30'
                  }`}
                >

                  <XCircle size={14} />

                  Reject

                </button>

              </div>

              {adminDecision && (

                <p className="text-[11px] text-slate-400 font-mono text-center pt-1">

                  Policy Status:{' '}

                  <span
                    className={
                      adminDecision ===
                      'ALLOWLISTED'
                        ? 'text-emerald-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {adminDecision}
                  </span>

                </p>

              )}

            </div>

          </div>

          {/* ==================== RIGHT PANEL ==================== */}
          <div className="lg:col-span-2 space-y-6 flex flex-col">

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col flex-1">

              {/* ==================== TABS ==================== */}
              <div className="flex border-b border-slate-800 mb-4 gap-6 overflow-x-auto">

                <button
                  onClick={() =>
                    setSelectedTab('diff')
                  }
                  className={`pb-3 text-xs font-medium border-b-2 cursor-pointer ${
                    selectedTab === 'diff'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'text-slate-400'
                  }`}
                >
                  Version Diff
                </button>

                <button
                  onClick={() =>
                    setSelectedTab(
                      'permissions'
                    )
                  }
                  className={`pb-3 text-xs font-medium border-b-2 cursor-pointer ${
                    selectedTab ===
                    'permissions'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'text-slate-400'
                  }`}
                >
                  Permissions
                </button>

                <button
                  onClick={() =>
                    setSelectedTab('sbom')
                  }
                  className={`pb-3 text-xs font-medium border-b-2 cursor-pointer ${
                    selectedTab === 'sbom'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'text-slate-400'
                  }`}
                >
                  SBOM Findings
                </button>

                <button
                  onClick={() =>
                    setSelectedTab('history')
                  }
                  className={`pb-3 text-xs font-medium border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    selectedTab ===
                    'history'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'text-slate-400'
                  }`}
                >

                  <History size={14} />

                  Scan History

                </button>

                {/* ==================== AUDIT TAB ==================== */}
                <button
                  onClick={() =>
                    setSelectedTab('audit')
                  }
                  className={`pb-3 text-xs font-medium border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    selectedTab === 'audit'
                      ? 'border-cyan-400 text-cyan-400'
                      : 'text-slate-400'
                  }`}
                >

                  <ShieldCheck
                    size={14}
                  />

                  Audit Trail

                </button>

              </div>

              <div className="space-y-4 flex-1">

                {/* ==================== BASELINE ==================== */}
                <div className="flex justify-between items-center text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">

                  <span>
                    Baseline: v1.0.0
                  </span>

                  <span className="text-cyan-400">
                    Target: {
                      analysis.version ||
                      "v1.1.0"
                    }
                  </span>

                </div>

                {/* ==================== VERSION DIFF ==================== */}
                {selectedTab === 'diff' && (

                  <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-slate-800 space-y-1">

                    <div className="text-slate-500">
                      // Version Comparison / Manifest Diff
                    </div>

                    <div className="text-cyan-400 bg-cyan-950/40 p-2 rounded mt-2 whitespace-pre-wrap">

                      {analysis.versionDiff ||
                        "No diff output generated yet."}

                    </div>

                  </div>

                )}

                {/* ==================== PERMISSIONS ==================== */}
                {selectedTab ===
                  'permissions' && (

                    <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-slate-800 space-y-1">

                      <div className="text-slate-500">
                        // Parsed manifest permissions
                      </div>

                      <div className="text-emerald-400 bg-emerald-950/40 p-2 rounded mt-2">

                        permissions: [
                        {permissions.join(', ')}
                        ]

                      </div>

                    </div>

                  )}

                {/* ==================== SBOM ==================== */}
                {selectedTab === 'sbom' && (

                  <div className="sbom-container bg-slate-950 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-slate-800 space-y-1">

                    <div className="text-slate-500">
                      // Software Bill of Materials (SBOM) Findings
                    </div>

                    <div className="text-amber-400 bg-amber-950/40 p-2 rounded mt-2 whitespace-pre-wrap">

                      {analysis.sbomFindings ||
                        scanData?.sbomFindings ||
                        "No SBOM data available for this package."}

                    </div>

                  </div>

                )}

                {/* ==================== SCAN HISTORY ==================== */}
                {selectedTab ===
                  'history' && (

                    <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-slate-800 space-y-2">

                      <div className="text-slate-500">
                        // Persistent Scan History from PostgreSQL DB
                      </div>

                      {scanHistory.length > 0 ? (

                        <div className="space-y-2 mt-2">

                          {scanHistory.map(
                            (item, idx) => (

                              <div
                                key={idx}
                                className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-300"
                              >

                                <div>

                                  <span className="text-white font-bold">
                                    {item.extensionName}
                                  </span>

                                  <span className="text-slate-500 text-[11px] block">

                                    {item.scannedAt
                                      ? new Date(
                                          item.scannedAt
                                        ).toLocaleString()
                                      : ''}

                                  </span>

                                </div>

                                <div className="flex items-center gap-4">

                                  <span className="text-cyan-400 font-semibold">
                                    Risk Score: {item.riskScore}
                                  </span>

                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      item.riskLevel ===
                                      'HIGH'
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    }`}
                                  >
                                    {
                                      item.riskLevel ||
                                      item.status
                                    }
                                  </span>

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      ) : (

                        <div className="text-slate-400 mt-2 p-3 text-center">
                          No scan history recorded in database yet.
                        </div>

                      )}

                    </div>

                  )}

                {/* ==================== AUDIT TRAIL ==================== */}
                {selectedTab === 'audit' && (

                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 space-y-4">

                    {/* ==================== AUDIT HEADER ==================== */}
                    <div className="flex items-center justify-between gap-4">

                      <div>

                        <div className="flex items-center gap-2">

                          <ShieldCheck
                            size={16}
                            className="text-cyan-400"
                          />

                          <div className="text-slate-200 font-semibold text-xs">
                            Security Audit Trail
                          </div>

                        </div>

                        <div className="text-slate-500 text-[11px] mt-1">
                          Persistent administrative decisions from PostgreSQL
                        </div>

                      </div>

                      <div className="flex items-center gap-2">

                        <span className="text-[10px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">

                          {auditLogs.length}{' '}

                          {auditLogs.length ===
                          1
                            ? 'event'
                            : 'events'}

                        </span>

                        <button
                          onClick={
                            fetchAuditLogs
                          }
                          disabled={
                            auditLoading
                          }
                          className="px-2.5 py-1 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-[10px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >

                          {auditLoading
                            ? 'Refreshing...'
                            : 'Refresh'}

                        </button>

                      </div>

                    </div>

                    {/* ==================== AUDIT EVENTS ==================== */}
                    {auditLogs.length >
                    0 ? (

                      <div className="space-y-2">

                        {auditLogs.map(
                          (log, idx) => {

                            const isAllowlisted =
                              log.decision ===
                              'ALLOWLISTED';

                            const parsedDate =
                              log.timestamp
                                ? new Date(
                                    log.timestamp
                                  )
                                : null;

                            const formattedDate =
                              parsedDate &&
                              !isNaN(
                                parsedDate.getTime()
                              )
                                ? parsedDate.toLocaleDateString(
                                    'en-IN'
                                  )
                                : 'N/A';

                            const formattedTime =
                              parsedDate &&
                              !isNaN(
                                parsedDate.getTime()
                              )
                                ? parsedDate.toLocaleTimeString(
                                    'en-IN'
                                  )
                                : 'N/A';

                            return (
                              <div
                                key={
                                  log.id ||
                                  idx
                                }
                                className="bg-slate-900 rounded-lg border border-slate-800 p-4 hover:border-slate-700 transition-colors"
                              >

                                <div className="flex justify-between items-start gap-4">

                                  {/* EVENT DETAILS */}
                                  <div className="space-y-2 min-w-0">

                                    <div className="flex items-center gap-2">

                                      {isAllowlisted ? (
                                        <CheckCircle
                                          size={15}
                                          className="text-emerald-400 shrink-0"
                                        />
                                      ) : (
                                        <XCircle
                                          size={15}
                                          className="text-rose-400 shrink-0"
                                        />
                                      )}

                                      <span className="text-white font-bold text-xs truncate">

                                        {log.extensionName ||
                                          'Unknown Extension'}

                                      </span>

                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[10px]">

                                      <div className="text-slate-500">

                                        Date:

                                        <span className="text-slate-300 ml-1">
                                          {formattedDate}
                                        </span>

                                      </div>

                                      <div className="text-slate-500">

                                        Time:

                                        <span className="text-slate-300 ml-1">
                                          {formattedTime}
                                        </span>

                                      </div>

                                      <div className="text-slate-500">

                                        User:

                                        <span className="text-slate-300 ml-1">
                                          {log.userEmail ||
                                            'Unknown'}
                                        </span>

                                      </div>

                                      <div className="text-slate-500">

                                        Scan ID:

                                        <span className="text-cyan-400 ml-1 font-mono">
                                          {log.scanId ||
                                            'N/A'}
                                        </span>

                                      </div>

                                    </div>

                                  </div>

                                  {/* DECISION BADGE */}
                                  <div className="shrink-0">

                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-bold border ${
                                        isAllowlisted
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                      }`}
                                    >

                                      {isAllowlisted ? (
                                        <CheckCircle
                                          size={11}
                                        />
                                      ) : (
                                        <XCircle
                                          size={11}
                                        />
                                      )}

                                      {log.decision ||
                                        'UNKNOWN'}

                                    </span>

                                  </div>

                                </div>

                              </div>
                            );
                          }
                        )}

                      </div>

                    ) : (

                      <div className="text-slate-400 p-6 text-center text-xs bg-slate-900 rounded-lg border border-slate-800">

                        No audit events recorded yet.

                      </div>

                    )}

                  </div>

                )}

              </div>

            </div>

          </div>

          {/* ==================== RISK ANALYSIS ==================== */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">

            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">

              <AlertOctagon
                size={16}
                className="text-amber-400"
              />

              Risk Analysis & Explanation

            </h3>

            <div className="space-y-2">

              {riskExplanations.length >
              0 ? (

                riskExplanations.map(
                  (exp, idx) => (

                    <div
                      key={idx}
                      className="text-xs p-3 bg-slate-950 rounded-lg border border-slate-800 text-amber-300 flex items-start gap-2"
                    >

                      <span className="text-amber-400 font-bold">
                        •
                      </span>

                      <span>
                        {exp}
                      </span>

                    </div>

                  )
                )

              ) : (

                <p className="text-xs text-slate-500">
                  No elevated security risks explained.
                </p>

              )}

            </div>

          </div>

        </div>

      </div>

      {/* ==================== PDF PREVIEW ==================== */}
      {showReportPreview && (

        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

            {/* MODAL HEADER */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/50">

              <div className="flex items-center gap-2">

                <ShieldAlert
                  className="text-cyan-400"
                  size={18}
                />

                <h3 className="text-sm font-bold text-white">
                  Scan Report Visual Preview
                </h3>

              </div>

              <div className="flex items-center gap-3">

                <button
                  onClick={() => {

                    handleDownloadPDF();

                    setShowReportPreview(
                      false
                    );

                  }}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >

                  <Download size={14} />

                  Export PDF

                </button>

                <button
                  onClick={() =>
                    setShowReportPreview(
                      false
                    )
                  }
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  ✕
                </button>

              </div>

            </div>

            {/* MODAL BODY */}
            <div className="p-8 overflow-y-auto space-y-6 bg-slate-950 text-slate-200 font-sans text-xs">

              <div className="max-w-3xl mx-auto bg-slate-900/60 border border-slate-800 rounded-xl p-8 space-y-6 shadow-inner">

                {/* PAPER HEADER */}
                <div className="pb-4 border-b border-slate-800 flex justify-between items-start">

                  <div>

                    <h2 className="text-xl font-bold text-white">
                      Browser Extension Risk Observatory
                    </h2>

                    <p className="text-[11px] text-slate-400">

                      Generated On:{' '}
                      {new Date().toLocaleString()}
                      {' | '}
                      Security Audit Trail

                    </p>

                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                      riskScore > 50
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >

                    SCORE: {riskScore} / 100

                  </span>

                </div>

                {/* METADATA */}
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800 text-[11px]">

                  <div>

                    <span className="text-slate-500">
                      Extension:
                    </span>{' '}

                    <strong className="text-white">
                      {
                        scanData.filename ||
                        analysis.name
                      }
                    </strong>

                  </div>

                  <div>

                    <span className="text-slate-500">
                      Admin Decision:
                    </span>{' '}

                    <strong className="text-cyan-400">
                      {adminDecision ||
                        scanData.status ||
                        'PENDING'}
                    </strong>

                  </div>

                  <div>

                    <span className="text-slate-500">
                      Manifest V:
                    </span>{' '}

                    <strong className="text-white">
                      {
                        analysis.manifestVersion ||
                        '3'
                      }
                    </strong>

                  </div>

                  <div>

                    <span className="text-slate-500">
                      Version:
                    </span>{' '}

                    <strong className="text-white">
                      {
                        analysis.version ||
                        '1.0.0'
                      }
                    </strong>

                  </div>

                </div>

                {/* PERMISSIONS */}
                <div className="space-y-2">

                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Detected Permissions
                  </h4>

                  <div className="grid grid-cols-2 gap-2">

                    {permissions.map(
                      (p, i) => (

                        <div
                          key={i}
                          className="p-2 bg-slate-950 rounded border border-slate-800/80 font-mono text-[11px] text-amber-300"
                        >

                          {i + 1}. {p}

                        </div>

                      )
                    )}

                  </div>

                </div>

                {/* LEAST PRIVILEGE */}
                <div className="space-y-3">

                  <div className="flex items-center justify-between">

                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Least-Privilege Permission Analysis
                    </h4>

                    <span
                      className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                        leastPrivilegeScore >= 80
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : leastPrivilegeScore >= 50
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >

                      {leastPrivilegeScore}
                      {' / 100 · '}
                      {leastPrivilegeLabel}

                    </span>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                    <div className="bg-slate-950 rounded-lg border border-slate-800 p-3">

                      <div className="text-[10px] uppercase tracking-wider text-slate-500">
                        Excessive Permissions
                      </div>

                      <div className="text-lg font-bold text-rose-400 mt-1">
                        {excessivePermissions.length}
                      </div>

                    </div>

                    <div className="bg-slate-950 rounded-lg border border-slate-800 p-3">

                      <div className="text-[10px] uppercase tracking-wider text-slate-500">
                        Analyzed Permissions
                      </div>

                      <div className="text-lg font-bold text-cyan-400 mt-1">
                        {permissionFindings.length}
                      </div>

                    </div>

                  </div>

                  {permissionFindings.length >
                  0 ? (

                    <div className="space-y-2">

                      {permissionFindings.map(
                        (finding, idx) => (

                          <div
                            key={`${finding.permission || 'permission'}-${idx}`}
                            className="bg-slate-950 rounded-lg border border-slate-800 p-3"
                          >

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="font-mono text-xs text-white">
                                {finding.permission}
                              </span>

                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {finding.category ||
                                  'Uncategorized'}
                              </span>

                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  finding.severity ===
                                  'CRITICAL'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : finding.severity ===
                                      'HIGH'
                                      ? 'bg-orange-500/20 text-orange-400'
                                      : finding.severity ===
                                        'MEDIUM'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {finding.severity ||
                                  'UNKNOWN'}
                              </span>

                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  finding.excessive
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {finding.excessive
                                  ? 'EXCESSIVE'
                                  : 'OK'}
                              </span>

                            </div>

                            <p className="text-[11px] text-slate-400 mt-2">
                              {finding.reason ||
                                'No explanation provided.'}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 text-xs text-slate-500">
                      No least-privilege findings returned by the backend.
                    </div>

                  )}

                </div>

                {/* REMOTE DOMAIN INVENTORY */}
                <div className="space-y-3">

                  <div className="flex items-center justify-between">

                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Remote-Domain Inventory
                    </h4>

                    <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">

                      {remoteDomainCount}{' '}

                      {remoteDomainCount ===
                      1
                        ? 'domain'
                        : 'domains'}{' '}

                      detected

                    </span>

                  </div>

                  {remoteDomains.length >
                  0 ? (

                    <div className="space-y-2">

                      {remoteDomains.map(
                        (domain, idx) => (

                          <div
                            key={`${domain.domain || 'domain'}-${domain.scheme || '*'}-${idx}`}
                            className="bg-slate-950 rounded-lg border border-slate-800 p-3"
                          >

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="font-mono text-xs text-white">
                                {domain.domain ||
                                  'Unknown Domain'}
                              </span>

                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {domain.scheme ||
                                  'HTTPS'}
                              </span>

                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {domain.scope ||
                                  'Unknown Scope'}
                              </span>

                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  domain.riskLevel ===
                                  'CRITICAL'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : domain.riskLevel ===
                                      'HIGH'
                                      ? 'bg-orange-500/20 text-orange-400'
                                      : domain.riskLevel ===
                                        'MEDIUM'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {domain.riskLevel ||
                                  'UNKNOWN'}
                              </span>

                            </div>

                            <div className="text-[11px] text-slate-400 mt-2">

                              Source:{' '}

                              {
                                domain.source ||
                                'Manifest'
                              }

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="bg-slate-950 rounded-lg border border-slate-800 p-3 text-xs text-slate-500">
                      No remote domains detected in the extension manifest.
                    </div>

                  )}

                </div>

                {/* VERSION DIFF */}
                <div className="space-y-2">

                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Version Diff / Manifest Changes
                  </h4>

                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 whitespace-pre-wrap">
                    {analysis.versionDiff ||
                      scanData.versionDiff ||
                      'No diff output generated.'}
                  </pre>

                </div>

                {/* SBOM */}
                <div className="space-y-2">

                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    SBOM Vulnerability Findings
                  </h4>

                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300 whitespace-pre-wrap">
                    {analysis.sbomFindings ||
                      scanData.sbomFindings ||
                      'No SBOM findings recorded.'}
                  </pre>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// ==================== METRIC CARD ====================
function MetricCard({
  title,
  value,
  sub,
  icon
}) {

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-start">

      <div>

        <p className="text-xs font-medium text-slate-400">
          {title}
        </p>

        <p className="text-2xl font-bold text-white my-0.5">
          {value}
        </p>

        <p className="text-[11px] text-slate-500">
          {sub}
        </p>

      </div>

      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
        {icon}
      </div>

    </div>
  );
}

// ==================== FINDING ITEM ====================
function FindingItem({
  label,
  detail,
  points,
  color
}) {

  return (
    <div className="flex justify-between items-center text-xs p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">

      <div>

        <div className="text-slate-200 font-medium">
          {label}
        </div>

        <div className="text-slate-400 text-[11px]">
          {detail}
        </div>

      </div>

      <span
        className={`font-mono font-bold ${color}`}
      >
        {points}
      </span>

    </div>
  );
}