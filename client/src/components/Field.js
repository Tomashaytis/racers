import './Field.css';
import { ClientApiContext } from '../contexts/ClientApiContext';
import { useContext, useEffect, useRef } from 'react';

function Field(props) {
    const clientApi = useContext(ClientApiContext); 
    const canvasRef = useRef(null);

    const drawFigures = (data) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let figure of data.figures) {
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
            ctx.fillStyle = figure.color;
            ctx.fill();

            const topPoint = figure.points.reduce((top, current) => current.y < top.y ? current : top);
            ctx.font = '14px Arial';
            ctx.fillStyle = figure.color;
            ctx.textAlign = 'center';
            ctx.fillText(figure.name, topPoint.x, topPoint.y - 10);
        }

        if (data.game.star !== null) {
            const innerRadius = 8;
            const outerRadius = 4;
            const spikes = 5
            const cx = data.game.star.x;
            const cy = data.game.star.y;

            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            const step = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);    
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;
                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.fillStyle = 'gold';
            ctx.strokeStyle = 'orange';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
        }
    };

    useEffect(() => {
        
        clientApi.dataCallback = drawFigures;
        return () => {
            clientApi.dataCallback = (data) => {};
        };
    }, [clientApi]);

    return (
        <canvas ref={canvasRef} width={props.width} height={props.height}></canvas>
    )
}

export default Field;