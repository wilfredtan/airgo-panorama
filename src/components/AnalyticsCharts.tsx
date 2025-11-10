import React from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { AnalyticsData } from '../types';

const ChartsContainer = styled.div`
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
`;

const ChartTitle = styled.h2`
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartWrapper = styled.div`
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

interface AnalyticsChartsProps {
  analytics: AnalyticsData | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ analytics }) => {
  if (!analytics || analytics.totalImages === 0) {
    return (
      <ChartsContainer>
        <ChartTitle>Data Analytics</ChartTitle>
        <p style={{ textAlign: 'center', color: '#666' }}>Upload some images to see analytics</p>
      </ChartsContainer>
    );
  }

  const bookmarkedCount = analytics.bookmarkedCount;
  const unbookmarkedCount = analytics.unbookmarkedCount;
  const totalCount = analytics.totalImages;

  const barData = [
    {
      name: 'Bookmarked',
      count: bookmarkedCount,
    },
    {
      name: 'Unbookmarked',
      count: unbookmarkedCount,
    },
  ];

  const pieData = [
    { name: 'Bookmarked', value: bookmarkedCount },
    { name: 'Unbookmarked', value: unbookmarkedCount },
  ];

  const totalSizeBookmarked = analytics.totalSizeBookmarked;
  const totalSizeUnbookmarked = analytics.totalSizeUnbookmarked;

  const sizeData = [
    {
      name: 'Bookmarked',
      size: Math.round(totalSizeBookmarked / 1024 / 1024 * 100) / 100, // MB
    },
    {
      name: 'Unbookmarked',
      size: Math.round(totalSizeUnbookmarked / 1024 / 1024 * 100) / 100, // MB
    },
  ];

  return (
    <ChartsContainer>
      <ChartTitle>Data Analytics</ChartTitle>
      <ChartsGrid>
        <ChartWrapper>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Image Count by Bookmark Status</h3>
          <BarChart width={400} height={300} data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ChartWrapper>

        <ChartWrapper>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Bookmark Distribution</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={pieData}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartWrapper>

        <ChartWrapper>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Total Size by Bookmark Status (MB)</h3>
          <BarChart width={400} height={300} data={sizeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="size" fill="#82ca9d" />
          </BarChart>
        </ChartWrapper>

        <ChartWrapper>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Summary</h3>
          <div style={{ padding: '20px' }}>
            <p><strong>Total Images:</strong> {totalCount}</p>
            <p><strong>Bookmarked:</strong> {bookmarkedCount} ({totalCount > 0 ? ((bookmarkedCount / totalCount) * 100).toFixed(1) : 0}%)</p>
            <p><strong>Unbookmarked:</strong> {unbookmarkedCount} ({totalCount > 0 ? ((unbookmarkedCount / totalCount) * 100).toFixed(1) : 0}%)</p>
            <p><strong>Total Size:</strong> {Math.round((totalSizeBookmarked + totalSizeUnbookmarked) / 1024 / 1024 * 100) / 100} MB</p>
          </div>
        </ChartWrapper>
      </ChartsGrid>
    </ChartsContainer>
  );
};

export default AnalyticsCharts;
