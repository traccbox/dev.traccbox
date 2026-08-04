import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  crumbs = [],
  actions,
}) => (
  <div className="mb-6">
    {crumbs.length > 0 && (
      <nav className="flex items-center flex-wrap gap-1 text-xs text-gray-500 mb-2">
        <Link to="/dashboard" className="hover:text-[#1658E5]">
          Dashboard
        </Link>
        {crumbs.map((c) => (
          <span key={c.label} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {c.to ? (
              <Link to={c.to} className="hover:text-[#1658E5]">
                {c.label}
              </Link>
            ) : (
              <span className="text-gray-700 font-medium">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
    )}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </div>
);

export default PageHeader;
