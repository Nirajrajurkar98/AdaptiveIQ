import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './difficulty-chart.css';

const results = [
  { difficulty: 'Easy', accuracy: 92, fill: '#5bbb8c' },
  { difficulty: 'Medium', accuracy: 78, fill: '#e9b452' },
  { difficulty: 'Hard', accuracy: 64, fill: '#8b80d2' },
];

export default function DifficultyChart() {
  return <div className="difficulty-chart" role="img" aria-label="Practice accuracy by difficulty: Easy 92 percent, Medium 78 percent, Hard 64 percent">
    <ResponsiveContainer width="100%" height={112}>
      <BarChart data={results} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
        <CartesianGrid stroke="#edf0f5" strokeDasharray="3 3" vertical={false}/>
        <XAxis dataKey="difficulty" axisLine={false} tickLine={false} tick={{ fill: '#8995a8', fontSize: 8 }}/>
        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9aa4b2', fontSize: 8 }} tickFormatter={(value: number) => `${value}%`}/>
        <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} cursor={{ fill: '#f5f6fb' }}/>
        <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {results.map((item) => <Cell key={item.difficulty} fill={item.fill}/>) }
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
