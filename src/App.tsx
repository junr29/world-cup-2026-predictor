import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import MyPredictions from './pages/MyPredictions';
import PredictorDetail from './pages/PredictorDetail';
import DataCenter from './pages/DataCenter';
import TeamDetail from './pages/TeamDetail';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Matches />} />
          <Route path="/match/:id" element={<MatchDetail />} />
          <Route path="/predictions" element={<MyPredictions />} />
          <Route path="/predictor/:sourceName" element={<PredictorDetail />} />
          <Route path="/analysis" element={<DataCenter />} />
          <Route path="/team/:teamName" element={<TeamDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}