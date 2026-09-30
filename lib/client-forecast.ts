import * as tf from "@tensorflow/tfjs";

const WINDOW_SIZE = 8;
const FEATURE_COUNT = 4;

function syntheticWindow(seed: number, startFuel: number) {
  const window: number[][] = [];
  let fuel = startFuel;
  let previousTemp = -29 + (seed % 13);

  for (let day = 0; day <= WINDOW_SIZE; day += 1) {
    const power = 610 + ((seed * 17 + day * 29) % 235);
    const temperature = Math.max(-44, Math.min(-17, previousTemp + Math.sin((day + seed) * 0.47) * 2.2));
    const load = 490 + ((seed * 11 + day * 23) % 380);
    const features = [fuel, power / 1000, (temperature + 50) / 50, load / 1000];
    window.push(features);

    const dailyUse = 0.004 + load / 1000 * 0.003 + power / 1000 * 0.0012;
    fuel = Math.max(0.08, fuel - dailyUse);
    previousTemp = temperature;
  }
  return window;
}

export async function trainAndForecast(initialFuelPercent: number, horizonDays = 15) {
  await tf.ready();
  const model = tf.sequential();
  model.add(tf.layers.lstm({
    units: 12,
    inputShape: [WINDOW_SIZE, FEATURE_COUNT],
    activation: "tanh",
    recurrentActivation: "sigmoid",
  }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
  model.compile({ optimizer: tf.train.adam(0.012), loss: "meanSquaredError" });

  const samples: number[][][] = [];
  const targets: number[][] = [];
  for (let seed = 0; seed < 180; seed += 1) {
    const series = syntheticWindow(seed, 0.53 + (seed % 38) / 100);
    samples.push(series.slice(0, WINDOW_SIZE));
    targets.push([series[WINDOW_SIZE][0]]);
  }

  const input = tf.tensor3d(samples, [samples.length, WINDOW_SIZE, FEATURE_COUNT]);
  const target = tf.tensor2d(targets, [targets.length, 1]);
  try {
    await model.fit(input, target, { epochs: 14, batchSize: 24, shuffle: true, verbose: 0 });

    const currentFuel = Math.max(0.05, Math.min(0.99, initialFuelPercent / 100));
    const recent = syntheticWindow(23, Math.min(0.99, currentFuel + 0.05));
    let sequence = recent.slice(0, WINDOW_SIZE);
    const dailyForecast: number[] = [];
    for (let day = 0; day < horizonDays; day += 1) {
      const sample = tf.tensor3d([sequence], [1, WINDOW_SIZE, FEATURE_COUNT]);
      const prediction = model.predict(sample) as tf.Tensor;
      const predictedFuel = (await prediction.data())[0];
      prediction.dispose();
      sample.dispose();
      dailyForecast.push(Math.max(0, Math.min(100, predictedFuel * 100)));

      const nextDay = day + WINDOW_SIZE;
      const nextTemperature = Math.max(-44, Math.min(-17, -29 + Math.sin((nextDay + 23) * 0.47) * 2.2));
      const nextPower = 720 + Math.sin((nextDay + 23) * 0.31) * 38;
      const nextLoad = 680 + Math.cos((nextDay + 23) * 0.27) * 75;
      sequence = [...sequence.slice(1), [predictedFuel, nextPower / 1000, (nextTemperature + 50) / 50, nextLoad / 1000]];
    }
    return dailyForecast;
  } finally {
    input.dispose();
    target.dispose();
    model.dispose();
  }
}
