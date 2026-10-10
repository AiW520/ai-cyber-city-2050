export const chapters = [
  {
    id: "architecture",
    num: "01",
    label: "AI ARCHITECTURE",
    title: "Buildings that think.",
    copy: "Adaptive towers breathe with the city, predicting energy, weather and human flow before the first signal arrives.",
    accent: "#00e5ff",
    place: "Adaptive towers",
    zh: {
      label: "智慧建筑",
      place: "自适应双塔",
      title: "会思考的建筑",
      copy: "建筑随城市呼吸，在信号到来前感知能源、天气与人流的变化。",
    },
    position: [-8, 0, -8] as [number, number, number],
  },
  {
    id: "robots",
    num: "02",
    label: "ROBOTICS",
    title: "A city with a pulse.",
    copy: "Service androids move through the streets as a quiet second nervous system—helpful, precise, unmistakably alive.",
    accent: "#ff2bd6",
    place: "Service quarter",
    zh: {
      label: "机器人服务",
      place: "机器人街区",
      title: "城市的第二套神经系统",
      copy: "服务机器人穿行街道，安静、精准地支持城市日常生活。",
    },
    position: [8, 0, -8] as [number, number, number],
  },
  {
    id: "mobility",
    num: "03",
    label: "SMART MOBILITY",
    title: "Traffic becomes choreography.",
    copy: "Autonomous flight lanes, magnetic rails and zero-emission streets make every commute feel like a clean escape velocity.",
    accent: "#8b5cff",
    place: "Transit exchange",
    zh: {
      label: "智慧交通",
      place: "磁轨交通枢纽",
      title: "让交通成为协作",
      copy: "自动飞行航道、磁轨与零排放街道，连接未来城市的每一次出行。",
    },
    position: [8, 0, 8] as [number, number, number],
  },
  {
    id: "life",
    num: "04",
    label: "FUTURE LIFE",
    title: "More life. Less friction.",
    copy: "From ambient health to instant translation, intelligence fades into the background so people can move forward.",
    accent: "#00ffa3",
    place: "Living gardens",
    zh: {
      label: "未来生活",
      place: "城市生态花园",
      title: "更多生活，更少阻碍",
      copy: "从无感健康服务到即时翻译，智能融入环境，让人们自在前行。",
    },
    position: [-8, 0, 8] as [number, number, number],
  },
] as const;

export type Quality = "auto" | "low" | "high";
export type CameraView = "overview" | "district" | "street";
export const assetPath = (name: string) =>
  `${process.env.NODE_ENV === "production" ? "/ai-cyber-city-2050" : ""}/${name}`;
