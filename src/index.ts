import shuffle from 'lodash/shuffle';
import range from 'lodash/range';
import min from 'lodash/min';
import max from 'lodash/max';
import isEqual from 'lodash/isEqual';

export enum GRID_SIZE {
    '3x3' = 3,
    '4x4' = 4,
    '5x5' = 5,
}

export enum SLIDE_DIRECTION {
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
    UP = 'UP',
    DOWN = 'DOWN',
}

export type SlideLimit = {
    [key in SLIDE_DIRECTION]: number[];
};

export type Transition = {
    [key in SLIDE_DIRECTION]: number | null;
};

export type SlideResult = {
    emptyCellIndex: number;
    transition: Transition;
};

export type GameConfig = {
    size: GRID_SIZE;
    grid?: number[];
};

export const DEFAULT_GRID_SIZE = GRID_SIZE['4x4'];

export default class Game {
    private readonly scale: GRID_SIZE;

    private readonly grid: number[];

    private readonly slideLimit: SlideLimit;

    private emptyCellIndex: number;

    private transition: Transition;

    constructor(config?: GameConfig) {
        const { size, grid } = config || {};

        this.scale = size || DEFAULT_GRID_SIZE;
        if (!this.validateScale()) {
            throw new Error(`Error! Wrong game board size passed: '${this.scale}'. Unable to start the game.`);
        }

        this.grid = grid || shuffle(range(0, this.scale * this.scale, 1));
        if (!this.validateGrid()) {
            throw new Error(`Error! Wrong game board passed: [${this.grid.join(',')}]. Unable to start game.`);
        }

        this.slideLimit = this.findLimits();
        this.emptyCellIndex = this.findEmptyCellIndex();
        this.transition = this.findTransitions();
    }

    private validateScale(): boolean {
        return Number.isInteger(this.scale) && Object.values(GRID_SIZE).includes(this.scale);
    }

    private validateGrid(): boolean {
        return (
            Array.isArray(this.grid) &&
            this.grid.length === this.scale * this.scale &&
            min(this.grid) === 0 &&
            max(this.grid) === this.scale * this.scale - 1 &&
            !this.grid
                .slice()
                .sort((a, b) => a - b)
                .some((v, i) => v !== i) &&
            !isEqual(this.grid, this.grid.slice().sort())
        );
    }

    private findLimits(): SlideLimit {
        return {
            [SLIDE_DIRECTION.LEFT]: range(0, this.scale * this.scale - 1, this.scale),
            [SLIDE_DIRECTION.RIGHT]: range(this.scale - 1, this.scale * this.scale, this.scale),
            [SLIDE_DIRECTION.UP]: range(0, this.scale, 1),
            [SLIDE_DIRECTION.DOWN]: range(this.scale * (this.scale - 1), this.scale * this.scale, 1),
        };
    }

    private findEmptyCellIndex(): number {
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i] === 0) {
                return i;
            }
        }

        throw new Error('Error! Could not find an empty cell in the game board.');
    }

    private findTransitions(): Transition {
        return {
            [SLIDE_DIRECTION.RIGHT]: !this.slideLimit.LEFT.includes(this.emptyCellIndex) ? this.emptyCellIndex - 1 : null,
            [SLIDE_DIRECTION.LEFT]: !this.slideLimit.RIGHT.includes(this.emptyCellIndex) ? this.emptyCellIndex + 1 : null,
            [SLIDE_DIRECTION.DOWN]: !this.slideLimit.UP.includes(this.emptyCellIndex) ? this.emptyCellIndex - this.scale : null,
            [SLIDE_DIRECTION.UP]: !this.slideLimit.DOWN.includes(this.emptyCellIndex) ? this.emptyCellIndex + this.scale : null,
        };
    }

    // public getEmptyCellRowNum(): number {
    //     return Math.floor(this.emptyCellIndex / this.scale) + 1;
    // }

    public getScale(): number {
        return this.scale;
    }

    public getGrid(): number[] {
        return this.grid;
    }

    public getSlideLimit(): SlideLimit {
        return this.slideLimit;
    }

    public getEmptyCellIndex(): number {
        return this.emptyCellIndex;
    }

    public getTransition(): Transition {
        return this.transition;
    }

    public doSlide(direction: SLIDE_DIRECTION): SlideResult {
        const targetIndex = this.transition[direction];
        if (!(targetIndex != null && Number.isInteger(targetIndex) && targetIndex >= 0 && targetIndex < this.grid.length)) {
            throw new Error(`Error! Wrong direction passed: '${direction}'. Unable to make a slide.`);
        }

        this.grid[this.emptyCellIndex] = this.grid[targetIndex];
        this.grid[targetIndex] = 0;
        this.emptyCellIndex = targetIndex;

        this.transition = this.findTransitions();

        return {
            emptyCellIndex: this.emptyCellIndex,
            transition: this.transition,
        };
    }
}
