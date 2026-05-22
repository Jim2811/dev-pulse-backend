import dotenv from "dotenv"
import path from "path"

dotenv.config({
    path: path.join(process.cwd(), ".env")
})

const config = {
    connectionString : process.env.DB_Connection_String as string,
    port : process.env.PORT
}

export default config