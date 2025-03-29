import './Field.css';
import { ClientApiContext } from '../contexts/ClientApiContext';
import { useContext, useEffect, useRef } from 'react';

function Field(probs) {
    const clientApi = useContext(ClientApiContext); 
    const canvasRef = useRef(null);

    const drawFigures = (figures) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let figure of figures) {
            if (figure.points.length === 0)
                continue;

            ctx.beginPath();
            ctx.moveTo(figure.points[0].x, figure.points[0].y);
            for (let i = 1; i < figure.points.length; i++) {
                ctx.lineTo(figure.points[i].x, figure.points[i].y);
            }
            ctx.closePath();

            ctx.strokeStyle = "#333333";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillstyle = figure.color;
            ctx.fill();

            const topPoint = figure.points.reduce((top, current) => current.y < top.y ? current : top);
            ctx.font = '14px Arial';
            ctx.fillStyle = figure.color;
            ctx.textAlign = 'center';
            ctx.fillText(figure.name, topPoint.x, topPoint.y - 10);
        }
    };

    useEffect(() => {
        clientApi.callback = drawFigures;
        return () => {
            clientApi.callback = (data) => {};
        };
    }, [clientApi]);

    return (
        <canvas ref={canvasRef} width={probs.width} height={probs.height}></canvas>
    )
}

export default Field;