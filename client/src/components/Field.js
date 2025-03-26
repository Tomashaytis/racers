import './Field.css';

function Field(probs) {
    return (
        <canvas width={probs.width} height={probs.height}></canvas>
    )
}

export default Field;