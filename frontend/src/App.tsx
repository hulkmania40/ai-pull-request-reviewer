import Navbar from "./components/customComponents/Navbar"
import ReviewerForm from "./components/customComponents/ReviewerForm"

export function App() {
  return (
    <div className="min-h-svh w-6xl mx-auto">
      <Navbar />
      <main className="p-6">
        <ReviewerForm />
      </main>
    </div>
  )
}

export default App
