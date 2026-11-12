// A component of the repository's own, shared by its screens (design/parts.json, part `shared`).
//
// The words on a control while its action waits. The control keeps the width of the wider of its
// two labels the whole time, so saying "working" never pushes what is beside it
// (design/behaviors.md, after an action).

// The label that is not showing still takes its room. Its letters are kept apart by a character
// of no width, so the page does not read as saying it: a check that waits for the words of a
// state must not find them before the state is there.
const NO_WIDTH = "‌";
const spaced = (text: string) => [...text].join(NO_WIDTH);

export function HeldLabel(props: { label: string; busyLabel: string; busy: boolean }) {
  return (
    <span className="grid">
      <span className="col-start-1 row-start-1">{props.busy ? props.busyLabel : props.label}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {spaced(props.busy ? props.label : props.busyLabel)}
      </span>
    </span>
  );
}
