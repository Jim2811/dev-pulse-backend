import express, { type Application, type NextFunction, type Request, type Response } from "express"
import cors from "cors"



const app: Application = express()
app.use(cors({
  origin: "http://localhost:5000"
}))
app.use(express.json())
app.use(express.text())
app.get('/', (req: Request, res: Response) => {
  res.status(200).json(
    {
      message: "This is home"
    }
  )
})



export default app
