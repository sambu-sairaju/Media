import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "./components/ui/layout/Layout";
import VideoPlayer from "./pages/VideoPlayer";
import PdfViewer from "./pages/PdfViewer";
import AudioRecorder from "./pages/AudioRecorder";
import WebGLViewer from "./pages/WebGLViewer";
import AudioReview from "./pages/AudioReview";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={VideoPlayer} />
        <Route path="/video" component={VideoPlayer} />
        <Route path="/pdf" component={PdfViewer} />
        <Route path="/audio-record" component={AudioRecorder} />
        <Route path="/webgl" component={WebGLViewer} />
        <Route path="/audio-review" component={AudioReview} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
