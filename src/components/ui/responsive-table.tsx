import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
    mobileLabel?: string;
    hideOnMobile?: boolean;
  }>;
  className?: string;
  keyField?: string;
}

export const ResponsiveTable = ({ 
  data, 
  columns, 
  className,
  keyField = 'id' 
}: ResponsiveTableProps) => {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className="text-left p-3 font-medium text-sm"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row[keyField] || index} className="border-b hover:bg-muted/50">
                {columns.map((column) => (
                  <td key={column.key} className="p-3 text-sm">
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => (
          <Card key={row[keyField] || index}>
            <CardContent className="p-4 space-y-2">
              {columns
                .filter(column => !column.hideOnMobile)
                .map((column) => (
                  <div key={column.key} className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground min-w-0 flex-1">
                      {column.mobileLabel || column.label}:
                    </span>
                    <span className="text-sm ml-2 text-right">
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
};