import React, { useState, useEffect, useRef, useCallback } from "react";

interface VisemeShift {
  x: number;
  y: number;
}

interface CharacterTiming {
  char: string;
  start: number;
  end: number;
}

const Face = () => {
  const [currentFrame, setCurrentFrame] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animationRef = useRef<number | undefined>(undefined);
  const flickerIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const baseAscii = `
                 ,     ,  ._  ,
                _.MMmm.mMm_Mm.MMm_:mMMmmm.._  .
           _ .-mmMMMMMMMMMMMMm:MMm:MMMMMMMMMm._
            \`-.mm.MMMMMMM:MMMMMMMmmMMMMMMMMMmm._
         _.mMMMMMmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM"~.
          .MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm._
         _.MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm._
      ..mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMmmm.
     _.mmMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm.
      _.MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm_
  .mmMMMMMMMMMMMMMMMMMMMMMMMM' \`MMMMMMMMMMMMMMMMMMMMMMm,
 _.-' _.mMMMMMMMMMMMMMMMMMMM'      \`MMMMMMMMMMMMMMMM""\`
  _,MMMmMMMMMMMMMMMMMMMM'            \`MMMMMMMMMMMMMMmm.
    _.-'MMMMMMMMMMMMMMM.'""'\`.    ,'""\`.MMMMMMMMMMMMMMMM.
   .mmMMMMMMMMMMMMMMMM' <(o)>\`  '<(o)>\` MMMMMMMMMMMMMMMm.
      .MMMMMMMMMMMMMMM                 'MMMMMMMMMMMMMMM:
   ,MMMmMMMMMMMMMMMMM'                 \`MMMMMMMMMMMMmm.
  ,ME:MMMMMMMMMMMMMM_6       -  -       7_MMMMMMMMM:Mm_
  !M:MmmMMMMMMMMMMMMML_                _JMMMMMMMMMm:MMm.
  '':mMMMMMMMMMMMMMMMM\\     ______     /dMMMMMMMMMMM:'Mm.
   ':MMM:MMMMMMMMMMMMMM\\    \`.__.'    /MMMMMM:MMMMMMm: \`
  .M:MMM:MMMMMMMMMMMMMMM\`.          ,'MMMMMMM:MMMMMMMm
    .Mm:mMMMMMMMMMMMMMMM| \`.      .' |MMMMMMm:.MMMMM.
   .Mm:mMMMMMMMMMMMMMMMM|   \`----':: |MMMMMMMmm\`MMMMMm.
     !:mMMMMMMMMMMMMMMMM|      ::::. |MMMMMMMMMMM\`\`mMm.
       !MMMMMMMMM'MMMMMM|      .:::. |MMMMMMMMMMMMM.._
       MMMMMMMMM'MMMM'M/       ::::'  \\MMMMMMMMMMMMMMm,
      .mMMMMMMM'MMMM'MMm.       '     .\`".MMMMMMMMMMMMm.
       !!JmMMM'MMM' \`M:.      ,  ,     .. M.".MMMMMMMMm.
        FMMMMMm.\`M   M..              .. \`Mm   \`"".MMMmm.
        MMMM'    M      ..           ..    \`M      MM\`.M!
        Mm'               ..        ..      M      M'   \\
        /                                                \\
`;

  // Simple viseme mapping for lip-sync shifts
  const visemeShifts: Record<string, VisemeShift> = {
    closed: { x: 0, y: 0 }, // B, P, M (no shift)
    open: { x: 1, y: 0 }, // A, I, E (slight right shift)
    wide: { x: 0, y: 1 }, // O, U (down shift for "open")
    pursed: { x: -1, y: 0 }, // F, V, S (left shift)
  };

  // Function to map character to viseme (approximate)
  const getViseme = (char: string): string => {
    char = char.toLowerCase();
    if ("bpm".includes(char)) return "closed";
    if ("aei".includes(char)) return "open";
    if ("ou".includes(char)) return "wide";
    if ("fvs".includes(char)) return "pursed";
    return "closed"; // Default/fallback
  };

  // Function to apply liveliness flicker (toggle ~20% of common chars)
  const applyFlicker = useCallback((frame: string): string => {
    return frame
      .split("")
      .map((char) => {
        if (Math.random() < 0.2) {
          // 20% chance
          if (char === ".") return ",";
          if (char === "M") return "N";
          if (char === "N") return "M";
          if (char === ",") return ".";
          if (char === ":") return ";";
          if (char === ";") return ":";
          if (char === "'") return '"';
          if (char === '"') return "'";
        }
        return char;
      })
      .join("");
  }, []);

  // Function to shift mouth position (approximate mouth area)
  const shiftMouth = useCallback(
    (frame: string, shift: VisemeShift): string => {
      const lines = frame.split("\n");
      const mouthStartLine = 19; // 0-based index; adjust for your art
      const mouthEndLine = 24;
      const mouthStartCol = 19;
      const mouthWidth = 12; // Approximate width of mouth area

      for (
        let i = mouthStartLine;
        i <= Math.min(mouthEndLine, lines.length - 1);
        i++
      ) {
        if (!lines[i]) continue;

        const line = lines[i];
        // Horizontal shift: Add/remove spaces
        let prefix = line.substring(0, mouthStartCol);
        const mouth = line.substring(mouthStartCol, mouthStartCol + mouthWidth);
        let suffix = line.substring(mouthStartCol + mouthWidth);

        if (shift.x > 0) {
          prefix += " ".repeat(shift.x);
          if (suffix.length >= shift.x) {
            suffix = suffix.slice(shift.x);
          }
        } else if (shift.x < 0) {
          suffix = " ".repeat(-shift.x) + suffix;
          if (prefix.length >= -shift.x) {
            prefix = prefix.slice(0, prefix.length + shift.x);
          }
        }
        lines[i] = prefix + mouth + suffix;

        // Vertical shift: Simple line swapping for demonstration
        if (shift.y > 0 && i < mouthEndLine && i + shift.y < lines.length) {
          // Swap current line with line below for "open mouth" effect
          const temp = lines[i];
          lines[i] = lines[i + 1] || "";
          lines[i + 1] = temp;
        }
      }
      return lines.join("\n");
    },
    []
  );

  // Start liveliness flicker animation
  const startFlicker = useCallback(() => {
    if (flickerIntervalRef.current) return;

    flickerIntervalRef.current = setInterval(() => {
      if (!isAnimating) {
        setCurrentFrame((prev) =>
          prev ? applyFlicker(prev) : applyFlicker(baseAscii)
        );
      }
    }, 100);
  }, [applyFlicker, baseAscii, isAnimating]);

  // Stop flicker animation
  const stopFlicker = useCallback(() => {
    if (flickerIntervalRef.current) {
      clearInterval(flickerIntervalRef.current);
      flickerIntervalRef.current = undefined;
    }
  }, []);

  // Lip-sync animation function (mock implementation for demo)
  const startLipSync = useCallback(
    (timings: CharacterTiming[], audio: HTMLAudioElement) => {
      setIsAnimating(true);

      const syncLoop = () => {
        if (audio.paused || audio.ended) {
          setIsAnimating(false);
          setCurrentFrame(baseAscii);
          return;
        }

        const time = audio.currentTime;
        const activeChar =
          timings.find((t) => time >= t.start && time < t.end)?.char || "";
        const viseme = getViseme(activeChar);
        const shift = visemeShifts[viseme] || { x: 0, y: 0 };

        // Apply flicker + mouth shift
        let currentFrame = applyFlicker(baseAscii);
        currentFrame = shiftMouth(currentFrame, shift);
        setCurrentFrame(currentFrame);

        animationRef.current = requestAnimationFrame(syncLoop);
      };

      audio.onplay = () => syncLoop();
      audio.onended = () => {
        setIsAnimating(false);
        setCurrentFrame(baseAscii);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    },
    [applyFlicker, baseAscii, getViseme, shiftMouth, visemeShifts]
  );

  // Demo function to simulate speech with mock timings
  const simulateSpeech = useCallback(() => {
    // Mock character timings for demonstration
    const mockTimings: CharacterTiming[] = [
      { char: "H", start: 0, end: 0.1 },
      { char: "e", start: 0.1, end: 0.2 },
      { char: "l", start: 0.2, end: 0.3 },
      { char: "l", start: 0.3, end: 0.4 },
      { char: "o", start: 0.4, end: 0.6 },
      { char: " ", start: 0.6, end: 0.7 },
      { char: "W", start: 0.7, end: 0.8 },
      { char: "o", start: 0.8, end: 0.9 },
      { char: "r", start: 0.9, end: 1.0 },
      { char: "l", start: 1.0, end: 1.1 },
      { char: "d", start: 1.1, end: 1.3 },
    ];

    // Create a mock audio element for demo
    const audio = new Audio();
    audio.src =
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; // Silent audio
    audioRef.current = audio;

    // Simulate 2 seconds of playback
    audio.play();
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 2000);

    startLipSync(mockTimings, audio);
  }, [startLipSync]);

  // Initialize with base ASCII
  useEffect(() => {
    setCurrentFrame(baseAscii);
    startFlicker();

    return () => {
      stopFlicker();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [baseAscii, startFlicker, stopFlicker]);

  return (
    <div
      style={{
        fontFamily: "monospace",
        whiteSpace: "pre",
        fontSize: "8px",
        lineHeight: "1",
      }}
    >
      <pre>{currentFrame}</pre>
      <div style={{ marginTop: "20px" }}>
        {/* <button
          onClick={simulateSpeech}
          disabled={isAnimating}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            backgroundColor: isAnimating ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isAnimating ? "not-allowed" : "pointer",
          }}
        >
          {isAnimating ? "Speaking..." : "Simulate Speech"}
        </button> */}
      </div>
    </div>
  );
};

export default Face;
