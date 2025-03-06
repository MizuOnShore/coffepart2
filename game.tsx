"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, ArrowRight, ArrowUp, Heart, Coffee } from "lucide-react"
import '/app/globals.css'

export default function CoffeeQuest() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<"menu" | "video" | "playing" | "dialogue" | "success" | "failure">("menu")
  const videoRef = useRef<HTMLVideoElement>(null)
  const bounceSoundRef = useRef<HTMLAudioElement | null>(null)
  const walkingSoundRef = useRef<HTMLAudioElement | null>(null)
  const [player, setPlayer] = useState({
    x: 50,
    y: 300,
    width: 40,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    direction: "right",
    animation: 0,
  })
  const [items, setItems] = useState([
    { id: "flower", x: 200, y: 320, width: 30, height: 30, collected: false },
    { id: "note", x: 400, y: 200, width: 30, height: 30, collected: false },
    { id: "coffee", x: 600, y: 150, width: 30, height: 30, collected: false },
  ])
  const [platforms, setPlatforms] = useState([
    { x: 0, y: 380, width: 800, height: 20 },
    { x: 350, y: 300, width: 200, height: 20 },
    { x: 550, y: 220, width: 150, height: 20 },
    { x: 150, y: 250, width: 150, height: 20 },
  ])
  const [girl, setGirl] = useState({ x: 700, y: 320, width: 40, height: 60 })
  const [dialogueStep, setDialogueStep] = useState(0)
  const [dialogueOptions, setDialogueOptions] = useState<string[]>([])
  const [collectedItems, setCollectedItems] = useState({ flower: false, note: false, coffee: false })
  const [keys, setKeys] = useState({ left: false, right: false, up: false })
  const [gameTime, setGameTime] = useState(0)

  useEffect(() => {
    bounceSoundRef.current = new Audio("/bounce.mp3")
  }, [])
  useEffect(() => {
    return () => {
      if (walkingSoundRef.current) {
        walkingSoundRef.current.pause();
        walkingSoundRef.current.currentTime = 0;
      }
    };
  }, []);
  // Game initialization
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return

      if (e.key === "ArrowLeft" || e.key === "a") setKeys((prev) => ({ ...prev, left: true }))
      if (e.key === "ArrowRight" || e.key === "d") setKeys((prev) => ({ ...prev, right: true }))
      if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") setKeys((prev) => ({ ...prev, up: true }))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") setKeys((prev) => ({ ...prev, left: false }))
      if (e.key === "ArrowRight" || e.key === "d") setKeys((prev) => ({ ...prev, right: false }))
      if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") setKeys((prev) => ({ ...prev, up: false }))
    }

    if (gameState === "video" && videoRef.current) {
      const video = videoRef.current
      video.play().catch((error) => {
        console.error("Video playback error:", error)
      })

      const handleVideoEnd = () => {
        setGameState("menu")
        startGame()
      }

      video.addEventListener("ended", handleVideoEnd)
      return () => {
        video.removeEventListener("ended", handleVideoEnd)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState])

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return

    const gameLoop = setInterval(() => {
      setGameTime((prev) => prev + 1)
      updateGame()
    }, 1000 / 60) // 60 FPS

    return () => clearInterval(gameLoop)
  }, [gameState, player, items, keys])

  // Canvas rendering
  useEffect(() => {
    if (!canvasRef.current || gameState !== "playing") return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    ctx.fillStyle = "#87CEEB"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw platforms
    platforms.forEach((platform) => {
      ctx.fillStyle = "#8B4513" // Brown platform
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height)

      // Add grass on top
      ctx.fillStyle = "#7CFC00" // Green grass
      ctx.fillRect(platform.x, platform.y - 5, platform.width, 5)
    })

    // Draw items
    items.forEach((item) => {
      if (item.collected) return

      if (item.id === "flower") {
        ctx.fillStyle = "#FF69B4" // Pink flower
        ctx.beginPath()
        ctx.arc(item.x + 15, item.y + 10, 10, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#32CD32" // Green stem
        ctx.fillRect(item.x + 13, item.y + 20, 4, 10)
      } else if (item.id === "note") {
        ctx.fillStyle = "#FFFFFF" // White note
        ctx.fillRect(item.x, item.y, item.width, item.height)
        ctx.fillStyle = "#000000" // Black lines
        ctx.fillRect(item.x + 5, item.y + 5, item.width - 10, 2)
        ctx.fillRect(item.x + 5, item.y + 10, item.width - 10, 2)
        ctx.fillRect(item.x + 5, item.y + 15, item.width - 10, 2)
        ctx.fillRect(item.x + 5, item.y + 20, item.width - 15, 2)
      } else if (item.id === "coffee") {
        ctx.fillStyle = "#8B4513" // Brown coffee
        ctx.fillRect(item.x, item.y + 10, item.width, item.height - 10)
        ctx.fillStyle = "#D2B48C" // Light brown lid
        ctx.fillRect(item.x + 5, item.y, item.width - 10, 10)
        ctx.fillStyle = "#FFFFFF" // White steam
        ctx.beginPath()
        ctx.arc(item.x + 15, item.y + 5, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    })

    // Draw girl
    ctx.fillStyle = "#FF69B4" // Pink dress
    ctx.fillRect(girl.x, girl.y, girl.width, girl.height)
    ctx.fillStyle = "#FFC0CB" // Light pink face
    ctx.fillRect(girl.x + 5, girl.y + 5, girl.width - 10, 20)
    ctx.fillStyle = "#000000" // Black eyes
    ctx.fillRect(girl.x + 10, girl.y + 10, 5, 5)
    ctx.fillRect(girl.x + 25, girl.y + 10, 5, 5)
    ctx.fillStyle = "#FF0000" // Red mouth
    ctx.fillRect(girl.x + 15, girl.y + 20, 10, 3)

    // Draw player
    ctx.fillStyle = "#4169E1" // Blue body
    ctx.fillRect(player.x, player.y, player.width, player.height)
    ctx.fillStyle = "#FFE4C4" // Light skin face
    ctx.fillRect(player.x + 5, player.y + 5, player.width - 10, 20)
    ctx.fillStyle = "#000000" // Black eyes
    if (player.direction === "right") {
      ctx.fillRect(player.x + 10, player.y + 10, 5, 5)
      ctx.fillRect(player.x + 25, player.y + 10, 5, 5)
    } else {
      ctx.fillRect(player.x + 5, player.y + 10, 5, 5)
      ctx.fillRect(player.x + 20, player.y + 10, 5, 5)
    }
    ctx.fillStyle = "#FF0000" // Red mouth
    ctx.fillRect(player.x + 15, player.y + 20, 10, 3)

    // In your canvas rendering logic
ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; // Semi-transparent black background
ctx.fillRect(10, 10, 200, 50); // Increase width to accommodate spacing

ctx.fillStyle = "#FFFFFF"; // White text
ctx.font = "16px 'Press Start 2P', cursive"; // Pixelated font
ctx.fillText("Inventory:", 20, 30);

// Draw collected items with proper spacing
if (collectedItems.flower) {
  ctx.fillStyle = "#FF69B4"; // Pink flower
  ctx.beginPath();
  ctx.arc(110, 25, 10, 0, Math.PI * 2); // Adjusted x position
  ctx.fill();
}

if (collectedItems.note) {
  ctx.fillStyle = "#FFFFFF"; // White note
  ctx.fillRect(130, 15, 20, 20); // Adjusted x position
}

if (collectedItems.coffee) {
  ctx.fillStyle = "#8B4513"; // Brown coffee
  ctx.fillRect(160, 15, 20, 20); // Adjusted x position
}
  }, [gameState, player, items, platforms, girl, collectedItems, gameTime])


  const updateGame = () => {
    let newVelocityX = 0;

    // Handle movement
    if (keys.left) newVelocityX = -5;
    if (keys.right) newVelocityX = 5;

    // Play walking sound if moving
    if ((keys.left || keys.right) && !player.isJumping) {
      if (walkingSoundRef.current && walkingSoundRef.current.paused) {
        walkingSoundRef.current.loop = true; // Loop the sound
        walkingSoundRef.current.play();
      }
    } else {
      // Stop walking sound if not moving
      if (walkingSoundRef.current) {
        walkingSoundRef.current.pause();
        walkingSoundRef.current.currentTime = 0; // Reset sound to start
      }
    }

    // Handle jumping
    let newVelocityY = player.velocityY;
    let isJumping = player.isJumping;

    if (keys.up && !player.isJumping) {
      newVelocityY = -15;
      isJumping = true;

      // Play the bounce sound
      if (bounceSoundRef.current) {
        bounceSoundRef.current.currentTime = 0;
        bounceSoundRef.current.play();
      }
    }

    // Apply gravity
    newVelocityY += 0.8;
    

    // Calculate new position
    let newX = player.x + newVelocityX
    let newY = player.y + newVelocityY

    // Check platform collisions
    let onPlatform = false
    platforms.forEach((platform) => {
      // Check if landing on a platform
      if (
        newVelocityY > 0 &&
        player.y + player.height <= platform.y &&
        newY + player.height >= platform.y &&
        newX + player.width > platform.x &&
        newX < platform.x + platform.width
      ) {
        newY = platform.y - player.height
        newVelocityY = 0
        isJumping = false
        onPlatform = true
      }

      // Check horizontal collisions
      if (
        newY + player.height > platform.y &&
        newY < platform.y + platform.height &&
        player.x + player.width <= platform.x &&
        newX + player.width >= platform.x
      ) {
        newX = platform.x - player.width
      }

      if (
        newY + player.height > platform.y &&
        newY < platform.y + platform.height &&
        player.x >= platform.x + platform.width &&
        newX <= platform.x + platform.width
      ) {
        newX = platform.x + platform.width
      }
    })

    // Check boundaries
    if (newX < 0) newX = 0
    if (newX + player.width > 800) newX = 800 - player.width

    // Check if player fell off the map
    if (newY > 500) {
      setGameState("failure")
      return
    }

    // Update player direction
    let direction = player.direction
    if (newVelocityX > 0) direction = "right"
    if (newVelocityX < 0) direction = "left"

    // Check item collisions
    const newItems = [...items]
    let itemCollected = false

    newItems.forEach((item) => {
      if (
        !item.collected &&
        newX < item.x + item.width &&
        newX + player.width > item.x &&
        newY < item.y + item.height &&
        newY + player.height > item.y
      ) {
        item.collected = true
        itemCollected = true
        setCollectedItems((prev) => ({ ...prev, [item.id]: true }))
      }
    })

    if (itemCollected) {
      setItems(newItems)
    }

    // Check if player reached the girl
    if (
      newX < girl.x + girl.width &&
      newX + player.width > girl.x &&
      newY < girl.y + girl.height &&
      newY + player.height > girl.y
    ) {
      setGameState("dialogue")
      setDialogueStep(0)
      setDialogueOptions(["pwede naman", "tempting, pero g", "tinatanong pa ba yan, syempre G"])
      return
    }

    // Update player state
    setPlayer({
      ...player,
      x: newX,
      y: newY,
      velocityX: newVelocityX,
      velocityY: newVelocityY,
      isJumping,
      direction,
      animation: (player.animation + 1) % 30,
    })
  }

  const handleDialogueOption = (option: string) => {
    if (dialogueStep === 0) {
      setDialogueStep(1)
      setDialogueOptions(["Yes", "hmm, pag isipan ko pero g ako", "G, plates lang naman"])
    } else if (dialogueStep === 1) {
      setDialogueStep(2)
      setDialogueOptions([
        "yes",
        "YES",
        "YESSSS!!!!",
      ])
    } else if (dialogueStep === 2) {
      if (collectedItems.flower && collectedItems.note && collectedItems.coffee) {
        setGameState("success")
      } else {
        setDialogueStep(3)
        setDialogueOptions(["I need to prepare better. Let me try again."])
      }
    } else {
      setGameState("playing")
    }
  }

  const startGame = () => {
    // Reset game state
    setGameState("playing")
    setPlayer({
      x: 50,
      y: 300,
      width: 40,
      height: 60,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      direction: "right",
      animation: 0,
    })
    setItems([
      { id: "flower", x: 200, y: 320, width: 30, height: 30, collected: false },
      { id: "note", x: 400, y: 200, width: 30, height: 30, collected: false },
      { id: "coffee", x: 600, y: 150, width: 30, height: 30, collected: false },
    ])
    setCollectedItems({ flower: false, note: false, coffee: false })
    setGameTime(0)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="relative w-full max-w-4xl">
        {gameState === "menu" && (
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <h1 className="text-4xl font-bold mb-6 text-white">Coffee Quest</h1>
            <p className="text-xl mb-8 text-gray-300">
              Collect the flower, note, and coffee!!!
            </p>
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <ArrowLeft className="mx-auto mb-2 text-white" />
                <p className="text-gray-300">Move Left</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <ArrowRight className="mx-auto mb-2 text-white" />
                <p className="text-gray-300">Move Right</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <ArrowUp className="mx-auto mb-2 text-white" />
                <p className="text-gray-300">Jump</p>
              </div>
            </div>
            <Button
  onClick={startGame}
  className="retro-button pixel-font"
>
  Start Game
</Button>
          </div>
        )}

        {gameState === "playing" && (
          <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="retro-canvas pixel-font"
        />
        )}

<Dialog open={gameState === "dialogue"} onOpenChange={() => setGameState("playing")}>
  <DialogContent className="sm:max-w-md bg-gray-800 border-4 border-gray-700 rounded-lg pixel-font">
    <DialogHeader>
      <DialogTitle className="text-2xl text-yellow-400">Tara Kape?</DialogTitle>
      <DialogDescription className="text-gray-300">
        Lapit na mag weekend!
      </DialogDescription>
    </DialogHeader>
    <div className="flex flex-col space-y-2 mt-4">
      {dialogueOptions.map((option, index) => (
        <Button
          key={index}
          variant="outline"
          onClick={() => handleDialogueOption(option)}
          className="justify-start text-left bg-gray-700 text-white border-2 border-gray-600 hover:bg-gray-600 hover:text-yellow-400 pixel-font"
        >
          {option}
        </Button>
      ))}
    </div>
  </DialogContent>
</Dialog>

<Dialog open={gameState === "success"} onOpenChange={() => setGameState("menu")}>
  <DialogContent className="sm:max-w-md bg-gray-800 border-4 border-gray-700 rounded-lg pixel-font">
    <DialogHeader>
      <DialogTitle className="text-2xl text-green-500 flex items-center gap-2">
        <span className="text-yellow-400"></span> Success! <span className="text-pink-500"></span>
      </DialogTitle>
      <DialogDescription className="text-lg text-gray-300">
        Set na agad, kape sa weekend!!!
      </DialogDescription>
    </DialogHeader>
    <div className="mt-4 text-center">
      <p className="mb-4 text-gray-300">
        para mas tempting libre ko na kape sa Sat?  
      </p>
      <Button
        onClick={() => {
          setGameState("video"); // Transition to video state
          if (videoRef.current) {
            const video = videoRef.current;
            video.currentTime = 0; // Restart video
            video
              .play()
              .then(() => console.log("Video playing"))
              .catch((error) => console.error("Video playback error:", error));
            video.onended = () => {
              setGameState("menu"); // Ensure it starts from menu, not directly in-game
              startGame(); // Reset everything and prepare for a new session
            };
          }
        }}
        className="retro-button"
      >
        Play Again
      </Button>
    </div>
  </DialogContent>
</Dialog>

        <Dialog open={gameState === "failure"} onOpenChange={() => setGameState("menu")}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-red-500">Oops! You fell off the map</DialogTitle>
              <DialogDescription>Don't worry, you can try again!</DialogDescription>
            </DialogHeader>
            <div className="mt-4 text-center">
              <Button onClick={() => setGameState("menu")}>Try Again</Button>
            </div>
          </DialogContent>
        </Dialog>
        {gameState === "video" && (
  <video ref={videoRef} width="800" height="450" controls={false}>
    <source src="/videoplayback.mp4" type="video/mp4" />
  </video>
)}

        {gameState === "playing" && (
          <div className="absolute top-4 right-4 bg-gray-800 p-2 rounded-lg text-white">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-pink-500" />
                <span>{collectedItems.flower ? "1" : "0"}/1</span>
              </div>
              <div>|</div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-300">📝</span>
                <span>{collectedItems.note ? "1" : "0"}/1</span>
              </div>
              <div>|</div>
              <div className="flex items-center gap-1">
                <Coffee className="h-4 w-4 text-brown-500" />
                <span>{collectedItems.coffee ? "1" : "0"}/1</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {gameState === "playing" && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="p-6"
            onMouseDown={() => setKeys((prev) => ({ ...prev, left: true }))}
            onMouseUp={() => setKeys((prev) => ({ ...prev, left: false }))}
            onTouchStart={() => setKeys((prev) => ({ ...prev, left: true }))}
            onTouchEnd={() => setKeys((prev) => ({ ...prev, left: false }))}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            className="p-6"
            onMouseDown={() => setKeys((prev) => ({ ...prev, up: true }))}
            onMouseUp={() => setKeys((prev) => ({ ...prev, up: false }))}
            onTouchStart={() => setKeys((prev) => ({ ...prev, up: true }))}
            onTouchEnd={() => setKeys((prev) => ({ ...prev, up: false }))}
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            className="p-6"
            onMouseDown={() => setKeys((prev) => ({ ...prev, right: true }))}
            onMouseUp={() => setKeys((prev) => ({ ...prev, right: false }))}
            onTouchStart={() => setKeys((prev) => ({ ...prev, right: true }))}
            onTouchEnd={() => setKeys((prev) => ({ ...prev, right: false }))}
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  )
}

