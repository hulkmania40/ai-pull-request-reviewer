import Navbar from "./components/customComponents/Navbar"
import ReviewerForm from "./components/customComponents/ReviewerForm/ReviewerForm"

export function App() {
  return (
    <div className="mx-auto min-h-svh w-full max-w-6xl px-4 sm:px-6">
      <Navbar />
      <main className="py-4 sm:py-6">
        <ReviewerForm />
      </main>
    </div>
  )
}

export default App
