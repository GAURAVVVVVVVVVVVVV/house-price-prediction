import { useState } from "react";
import Sidebar       from "./components/Sidebar";
import Predict       from "./pages/Predict";
import ImageAnalysis from "./pages/ImageAnalysis";
import Compare       from "./pages/Compare";
import Dashboard     from "./pages/Dashboard";
import About         from "./pages/About";
import ChatBot       from "./components/ChatBot";

export default function App() {
  const [page, setPage] = useState("predict");
  const [predResult,  setPredResult]  = useState(null);
  const [predPayload, setPredPayload] = useState(null);

  return (
    <div className="layout">
      <Sidebar page={page} setPage={setPage}/>
      <main className="main">
        {page === "predict"   && <Predict onPrediction={(r,p) => { setPredResult(r); setPredPayload(p); }}/>}
        {page === "image"     && <ImageAnalysis basePrediction={predResult?.predicted_price}/>}
        {page === "compare"   && <Compare/>}
        {page === "dashboard" && <Dashboard/>}
        {page === "about"     && <About/>}
      </main>
      <ChatBot result={predResult} propertyCtx={predPayload ? { ...predPayload, ...predResult } : null}/>
    </div>
  );
}
