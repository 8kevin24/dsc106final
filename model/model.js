async function loadONNXModel() {
    try {
        // Load the ONNX model
        const session = await ort.InferenceSession.create("xgboost_model.onnx");
        console.log("✅ ONNX model loaded successfully!", session);

        return session;
    } catch (error) {
        console.error("❌ Error loading ONNX model:", error);
    }
}

async function predictONNX(inputArray) {
    const session = await loadONNXModel();
    if (!session) return;
    console.log('predicitng');

    // Convert input array to an ONNX tensor (Float32)
    const tensorInput = new ort.Tensor("float32", new Float32Array(inputArray), [1, inputArray.length]);

    // Create input feed
    const feeds = {
        "float_input": new ort.Tensor("float32", new Float32Array([60, 170, 70, 12.5, 250, 1, 0, 0, 1, 0, 0]), [1, 11])
    };
    
    console.log('1');
    // Run the model
    const results = await session.run(feeds);
    console.log("🔮 Prediction result:", results);
    console.log('12');
    // Extract the predicted probability
    const predictedValue = results[Object.keys(results)[0]].data[0];

    // Display result
    document.getElementById("output").innerText = `Predicted Probability: ${predictedValue}`;
}

// Example input (must match the format used during training)
const exampleInput = [60, 170, 70, 12.5, 250, 1, 0, 0, 1, 0, 0];



// Run prediction on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('website live');
    await predictONNX(exampleInput);
    
});
