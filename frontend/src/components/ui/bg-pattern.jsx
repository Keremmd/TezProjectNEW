import React from 'react';
import { cn } from '../../lib/utils';

const BGPattern = ({
	variant = 'grid',
	mask = 'none',
	size = 24,
	fill = '#252525',
	className,
	style,
	...props
}) => {
	const bgSize = `${size}px ${size}px`;
	
	let backgroundImage;
	switch (variant) {
		case 'dots':
			backgroundImage = `radial-gradient(${fill} 1px, transparent 1px)`;
			break;
		case 'grid':
			backgroundImage = `linear-gradient(to right, ${fill} 1px, transparent 1px), linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
			break;
		case 'diagonal-stripes':
			backgroundImage = `repeating-linear-gradient(45deg, ${fill}, ${fill} 1px, transparent 1px, transparent ${size}px)`;
			break;
		case 'horizontal-lines':
			backgroundImage = `linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
			break;
		case 'vertical-lines':
			backgroundImage = `linear-gradient(to right, ${fill} 1px, transparent 1px)`;
			break;
		case 'checkerboard':
			backgroundImage = `linear-gradient(45deg, ${fill} 25%, transparent 25%), linear-gradient(-45deg, ${fill} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${fill} 75%), linear-gradient(-45deg, transparent 75%, ${fill} 75%)`;
			break;
		default:
			backgroundImage = `linear-gradient(to right, ${fill} 1px, transparent 1px), linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
	}

	let maskImage;
	switch (mask) {
		case 'fade-edges':
			maskImage = 'radial-gradient(ellipse at center, black, transparent)';
			break;
		case 'fade-center':
			maskImage = 'radial-gradient(ellipse at center, transparent, black)';
			break;
		case 'fade-top':
			maskImage = 'linear-gradient(to bottom, transparent, black)';
			break;
		case 'fade-bottom':
			maskImage = 'linear-gradient(to bottom, black, transparent)';
			break;
		case 'fade-left':
			maskImage = 'linear-gradient(to right, transparent, black)';
			break;
		case 'fade-right':
			maskImage = 'linear-gradient(to right, black, transparent)';
			break;
		case 'fade-x':
			maskImage = 'linear-gradient(to right, transparent, black, transparent)';
			break;
		case 'fade-y':
			maskImage = 'linear-gradient(to bottom, transparent, black, transparent)';
			break;
		default:
			maskImage = undefined;
	}

	return (
		<div
			className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
			style={{
				backgroundImage,
				backgroundSize: bgSize,
				WebkitMaskImage: maskImage,
				maskImage: maskImage,
				...style,
			}}
			{...props}
		/>
	);
};

BGPattern.displayName = 'BGPattern';
export { BGPattern };
