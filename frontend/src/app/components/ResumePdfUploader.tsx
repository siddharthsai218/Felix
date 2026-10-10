'use client';

import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';

export interface ParsedResumeData {
  extractedText: string;
  fileName: string;
  summary: string;
  skills: string[];
  projects: Array<{ name: string; description: string; techStack?: string[] }>;
}

interface ResumePdfUploaderProps {
  onParsed: (data: ParsedResumeData) => void;
  onRemove?: () => void;
  initialFileName?: string;
  initialExtractedText?: string;
}

export function ResumePdfUploader({
  onParsed,
  onRemove,
  initialFileName = '',
  initialExtractedText = '',
}: ResumePdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>(initialFileName);
  const [fileSize, setFileSize] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<Array<{ name: string; description: string; techStack?: string[] }>>([]);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore from initial values if provided
  useEffect(() => {
    if (initialFileName && !fileName) {
      setFileName(initialFileName);
    }
    if (initialExtractedText && !summary) {
      // Extract brief preview if available
      const firstLine = initialExtractedText.split('\n')[0] || '';
      setSummary(firstLine.replace(/^Summary:\s*/, '').slice(0, 180));
    }
  }, [initialFileName, initialExtractedText]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleProcessFile = async (file: File) => {
    setError(null);

    // Validate PDF
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please upload a PDF document (.pdf). Text files and images are not supported.');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError('File size exceeds 12MB limit. Please upload a smaller PDF resume.');
      return;
    }

    setIsUploading(true);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Could not parse resume text.');
      }

      setSummary(data.summary || '');
      setSkills(Array.isArray(data.skills) ? data.skills : []);
      setProjects(Array.isArray(data.projects) ? data.projects : []);

      const parsedPayload: ParsedResumeData = {
        extractedText: data.extractedText || data.rawTextSnippet || '',
        fileName: file.name,
        summary: data.summary || '',
        skills: Array.isArray(data.skills) ? data.skills : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
      };

      onParsed(parsedPayload);
    } catch (err: any) {
      console.error('Resume upload error:', err);
      setError(err?.message || 'Failed to extract text from PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName('');
    setFileSize('');
    setSummary('');
    setSkills([]);
    setProjects([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove?.();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Upload State / Drop Zone */}
      {!fileName && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`group cursor-pointer relative rounded-2xl border-2 border-dashed p-6 transition-all duration-200 text-center ${
            isDragging
              ? 'border-violet-500 bg-violet-950/30 ring-2 ring-violet-500/30'
              : 'border-gray-800 bg-gray-950/70 hover:border-gray-700 hover:bg-gray-900/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-violet-950/60 border border-violet-800/40 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shadow-inner">
              📄
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-200">
                Upload your Resume PDF
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Drag and drop your <span className="text-violet-400 font-mono font-medium">.pdf</span> resume file here, or{' '}
                <span className="text-violet-400 underline underline-offset-2 hover:text-violet-300">
                  browse files
                </span>
              </p>
            </div>

            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Maximum file size: 10MB • PDF format only
            </span>
          </div>
        </div>
      )}

      {/* Uploading Progress State */}
      {isUploading && (
        <div className="p-5 rounded-2xl bg-gray-900/80 border border-violet-500/30 shadow-lg flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-violet-950 border border-violet-700/50 flex items-center justify-center text-xl shrink-0">
            ⏳
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-violet-300 truncate">
                Extracting {fileName}...
              </span>
              <span className="text-gray-400 text-[11px] font-mono">Parsing PDF</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full w-2/3 animate-indeterminate"></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Extracting projects, tech stack, and achievements for question grounding...
            </p>
          </div>
        </div>
      )}

      {/* Uploaded File Card with Grounding Highlights */}
      {fileName && !isUploading && (
        <div className="rounded-2xl bg-gray-900/80 border border-emerald-500/30 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-700/40 flex items-center justify-center text-xl shrink-0">
                📄
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                    {fileName}
                  </h4>
                  {fileSize && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      ({fileSize})
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    ✓ Parsed
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-sm">
                  {summary || 'Technical resume parsed and ready for interview grounding.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-[11px] font-medium text-gray-300 transition-colors"
                title="Replace with another PDF"
              >
                Change PDF
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs transition-colors border border-red-800/40"
                title="Remove resume"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Detected Skills Badges */}
          {skills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">
                Detected Skills:
              </span>
              {skills.slice(0, 10).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-gray-950 text-indigo-300 text-[10px] font-mono border border-indigo-900/40"
                >
                  {skill}
                </span>
              ))}
              {skills.length > 10 && (
                <span className="text-[10px] text-gray-500 font-mono">
                  +{skills.length - 10} more
                </span>
              )}
            </div>
          )}

          {/* Expandable Preview of Projects and Grounding Details */}
          {(projects.length > 0 || summary) && (
            <div className="pt-2 border-t border-gray-800/80">
              <button
                type="button"
                onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                className="flex items-center justify-between w-full text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
              >
                <span>
                  {isPreviewExpanded ? 'Hide' : 'View'} Grounded Resume Context & Projects ({projects.length} found)
                </span>
                <span>{isPreviewExpanded ? '▲' : '▼'}</span>
              </button>

              {isPreviewExpanded && (
                <div className="mt-3 p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-2.5 text-xs text-gray-300">
                  {summary && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                        Technical Summary
                      </span>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{summary}</p>
                    </div>
                  )}

                  {projects.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        Highlighted Projects for Interview Questions
                      </span>
                      <div className="space-y-1.5">
                        {projects.map((proj, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-2 rounded-lg bg-gray-900/60 border border-gray-800"
                          >
                            <span className="font-semibold text-white text-[11px]">
                              {proj.name}
                            </span>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {proj.description}
                            </p>
                            {proj.techStack && proj.techStack.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {proj.techStack.map((tech, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="text-[9px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 font-mono"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
