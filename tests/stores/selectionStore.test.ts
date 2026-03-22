import { useSelectionStore } from '../../src/stores/selectionStore';

describe('selectionStore', () => {
  beforeEach(() => {
    useSelectionStore.setState({
      startSurah: null,
      startAyah: null,
      endSurah: null,
      endAyah: null,
      isRangeComplete: false,
    });
  });

  it('has correct initial state', () => {
    const state = useSelectionStore.getState();
    expect(state.startSurah).toBeNull();
    expect(state.startAyah).toBeNull();
    expect(state.endSurah).toBeNull();
    expect(state.endAyah).toBeNull();
    expect(state.isRangeComplete).toBe(false);
  });

  it('setStart sets startSurah and startAyah, clears end', () => {
    useSelectionStore.getState().setStart(1, 3);
    const state = useSelectionStore.getState();
    expect(state.startSurah).toBe(1);
    expect(state.startAyah).toBe(3);
    expect(state.endSurah).toBeNull();
    expect(state.endAyah).toBeNull();
    expect(state.isRangeComplete).toBe(false);
  });

  it('setEnd sets endSurah and endAyah after setStart', () => {
    useSelectionStore.getState().setStart(1, 3);
    useSelectionStore.getState().setEnd(1, 7);
    const state = useSelectionStore.getState();
    expect(state.endSurah).toBe(1);
    expect(state.endAyah).toBe(7);
    expect(state.isRangeComplete).toBe(true);
  });

  it('clearSelection resets all to null', () => {
    useSelectionStore.getState().setStart(1, 3);
    useSelectionStore.getState().setEnd(1, 7);
    useSelectionStore.getState().clearSelection();
    const state = useSelectionStore.getState();
    expect(state.startSurah).toBeNull();
    expect(state.startAyah).toBeNull();
    expect(state.endSurah).toBeNull();
    expect(state.endAyah).toBeNull();
    expect(state.isRangeComplete).toBe(false);
  });

  it('isRangeComplete is true only when both start and end are set', () => {
    expect(useSelectionStore.getState().isRangeComplete).toBe(false);

    useSelectionStore.getState().setStart(1, 1);
    expect(useSelectionStore.getState().isRangeComplete).toBe(false);

    useSelectionStore.getState().setEnd(1, 5);
    expect(useSelectionStore.getState().isRangeComplete).toBe(true);
  });

  it('getRange returns AyahRange when complete', () => {
    useSelectionStore.getState().setStart(2, 1);
    useSelectionStore.getState().setEnd(2, 5);
    const range = useSelectionStore.getState().getRange();
    expect(range).toEqual({
      surahNumber: 2,
      startAyah: 1,
      endAyah: 5,
    });
  });

  it('getRange returns null when incomplete', () => {
    useSelectionStore.getState().setStart(1, 1);
    expect(useSelectionStore.getState().getRange()).toBeNull();
  });
});
