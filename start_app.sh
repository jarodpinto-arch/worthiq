kill -9 $(lsof -t -i:3000) 2>/dev/null
kill -9 $(lsof -t -i:8080) 2>/dev/null
ROOT="/Users/jarodpinto/Projects/financial-app"

echo "🚀 Starting WorthIQ..."
echo "📦 Backend starting..."
cd "$ROOT/backend" && npm run start:dev &
B_PID=$!
sleep 4
echo "💻 Frontend starting..."
cd "$ROOT/frontend" && npx next dev --webpack
F_PID=$!

trap "kill $B_PID $F_PID; exit" INT
wait
